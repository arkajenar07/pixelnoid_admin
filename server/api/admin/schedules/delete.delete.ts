// server/api/admin/schedules/delete.delete.ts
// Deletes a schedule from Supabase AND removes the Google Calendar event

import { createClient } from '@supabase/supabase-js'
import { syncDeleteEvent } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const db = createClient(
    config.supabaseUrl || process.env.SUPABASE_URL || '',
    config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { id } = await readBody(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required.' })

  // 1. Delete Google event first (needs the event ID from DB)
  try {
    await syncDeleteEvent(id)
  } catch { /* Google deletion failure must not block DB deletion */ }

  // 2. Delete from Supabase
  const { error } = await db.from('teaching_schedules').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, statusMessage: `Failed to delete schedule: ${error.message}` })

  return { success: true }
})
