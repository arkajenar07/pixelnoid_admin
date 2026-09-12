// server/utils/google-calendar-db.ts
// Server-only: reads/writes google_calendar_connections using service role key
// NEVER expose access_token or refresh_token to the browser

import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl || process.env.SUPABASE_URL || ''
  const key = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface CalendarConnection {
  id: string
  google_email: string | null
  google_calendar_id: string | null
  google_calendar_name: string | null
  access_token: string | null
  refresh_token: string
  token_expires_at: string | null
  created_at: string
  updated_at: string
}

/** Get the single active Pixelnoid Google Calendar connection (if any) */
export async function getCalendarConnection(): Promise<CalendarConnection | null> {
  const db = getAdminClient()
  const { data, error } = await db
    .from('google_calendar_connections')
    .select('*')
    .limit(1)
    .single()
  if (error || !data) return null
  return data as CalendarConnection
}

/** Upsert (insert-or-replace) the master Google Calendar connection */
export async function saveCalendarConnection(payload: {
  google_email?: string
  google_calendar_id?: string
  google_calendar_name?: string
  access_token?: string
  refresh_token: string
  token_expires_at?: string | null
}) {
  const db = getAdminClient()
  // Delete any previous connection (singleton pattern)
  await db.from('google_calendar_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error } = await db.from('google_calendar_connections').insert({
    ...payload,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(`Failed to save calendar connection: ${error.message}`)
}

/** Update only tokens (called after token refresh) */
export async function updateStoredTokens(connection: CalendarConnection, accessToken: string, expiryDate: number) {
  const db = getAdminClient()
  await db
    .from('google_calendar_connections')
    .update({
      access_token: accessToken,
      token_expires_at: new Date(expiryDate).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)
}

/** Update the selected calendar ID and name */
export async function updateSelectedCalendar(calendarId: string, calendarName: string) {
  const db = getAdminClient()
  const { error } = await db
    .from('google_calendar_connections')
    .update({ google_calendar_id: calendarId, google_calendar_name: calendarName, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw new Error(`Failed to update calendar: ${error.message}`)
}

/** Remove all credentials — keeps application schedules intact */
export async function disconnectCalendar() {
  const db = getAdminClient()
  await db.from('google_calendar_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}

/** Update Google sync status on a teaching schedule */
export async function updateScheduleSyncStatus(
  scheduleId: string,
  status: 'pending' | 'synced' | 'failed' | 'not_required',
  googleEventId?: string | null,
  errorMessage?: string | null
) {
  const db = getAdminClient()
  await db
    .from('teaching_schedules')
    .update({
      google_sync_status: status,
      google_event_id: googleEventId !== undefined ? googleEventId : undefined,
      google_sync_error: errorMessage ?? null,
      google_last_synced_at: status === 'synced' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)
}
