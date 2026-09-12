// server/api/admin/schedules/update.patch.ts
// Updates a teaching schedule then syncs changes to Google Calendar

import { createClient } from '@supabase/supabase-js'
import { syncUpdateEvent } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const db = createClient(
    config.supabaseUrl || process.env.SUPABASE_URL || '',
    config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const body = await readBody(event)
  const {
    id,
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

  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required.' })
  if (!is_all_day && new Date(end_at) <= new Date(start_at)) {
    throw createError({ statusCode: 400, statusMessage: 'end_at must be greater than start_at.' })
  }

  const { data: schedule, error } = await db
    .from('teaching_schedules')
    .update({
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !schedule) {
    throw createError({ statusCode: 500, statusMessage: `Failed to update schedule: ${error?.message}` })
  }

  let syncResult: { success: boolean; error?: string } = { success: false }
  try {
    syncResult = await syncUpdateEvent(id)
  } catch (err: any) {
    syncResult = { success: false, error: err?.message }
  }

  return {
    schedule,
    googleSync: {
      success: syncResult.success,
      error: syncResult.success ? null : (syncResult.error ?? 'Sync failed'),
    },
  }
})
