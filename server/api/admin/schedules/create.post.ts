// server/api/admin/schedules/create.post.ts
// Creates a teaching schedule then auto-syncs to Google Calendar

import { createClient } from '@supabase/supabase-js'
import { syncCreateEvent } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const db = createClient(
    config.supabaseUrl || process.env.SUPABASE_URL || '',
    config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const body = await readBody(event)
  const {
    title,
    description,
    start_at,
    end_at,
    is_all_day,
    recurrence,
    location,
    meet_link,
    mentor_email,
    student_emails,
    guest_emails,
    guest_permissions,
    notifications,
    color,
    status,
    visibility,
  } = body ?? {}

  if (!title || !start_at || !end_at) {
    throw createError({ statusCode: 400, statusMessage: 'title, start_at, and end_at are required.' })
  }
  if (!is_all_day && new Date(end_at) <= new Date(start_at)) {
    throw createError({ statusCode: 400, statusMessage: 'end_at must be greater than start_at.' })
  }

  // 1. Insert schedule into Supabase
  const { data: schedule, error } = await db
    .from('teaching_schedules')
    .insert({
      title,
      description: description ?? null,
      start_at,
      end_at,
      is_all_day: is_all_day ?? false,
      recurrence: recurrence ?? 'none',
      location: location ?? null,
      meet_link: meet_link ?? null,
      mentor_email: mentor_email ?? null,
      student_emails: student_emails ?? [],
      guest_emails: guest_emails ?? [],
      guest_permissions: guest_permissions ?? { modify: false, invite: true, see_list: true },
      notifications: notifications ?? [{ type: 'email', minutes: 30 }],
      color: color ?? null,
      status: status ?? 'busy',
      visibility: visibility ?? 'default',
      google_sync_status: 'pending',
    })
    .select()
    .single()

  if (error || !schedule) {
    throw createError({ statusCode: 500, statusMessage: `Failed to create schedule: ${error?.message}` })
  }

  // 2. Sync to Google Calendar (non-blocking on failure — schedule is safe)
  let syncResult: { success: boolean; googleEventId?: string; error?: string } = { success: false }
  try {
    syncResult = await syncCreateEvent(schedule.id)
  } catch (err: any) {
    syncResult = { success: false, error: err?.message ?? 'Unknown sync error' }
  }

  return {
    schedule,
    googleSync: {
      success: syncResult.success,
      error: syncResult.success ? null : (syncResult.error ?? 'Sync failed'),
    },
  }
})
