// server/api/google-calendar/sync/retry.post.ts
// Retry sync for a schedule with google_sync_status = 'failed'
// Uses smart logic: if event_id exists → update, else → create

import { syncCreateEvent, syncUpdateEvent } from '../../../utils/google-calendar'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { scheduleId } = await readBody(event)
  if (!scheduleId) throw createError({ statusCode: 400, statusMessage: 'scheduleId required' })

  const config = useRuntimeConfig()
  const db = createClient(
    config.supabaseUrl || process.env.SUPABASE_URL || '',
    config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: schedule } = await db
    .from('teaching_schedules')
    .select('google_event_id')
    .eq('id', scheduleId)
    .single()

  if (!schedule) throw createError({ statusCode: 404, statusMessage: 'Schedule not found.' })

  // Anti-duplicate: update if event already exists, create if not
  if (schedule.google_event_id) {
    return syncUpdateEvent(scheduleId)
  }
  return syncCreateEvent(scheduleId)
})
