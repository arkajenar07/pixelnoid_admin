// server/utils/google-calendar.ts
// Core Google Calendar sync service — server-only
import { google } from 'googleapis'
import { createGoogleOAuthClient } from './google-oauth'
import { getCalendarConnection, updateStoredTokens, updateScheduleSyncStatus } from './google-calendar-db'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const config = useRuntimeConfig()
  return createClient(
    config.supabaseUrl || process.env.SUPABASE_URL || '',
    config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Build authenticated Google Calendar client with auto token refresh */
export async function getAuthenticatedCalendar() {
  const connection = await getCalendarConnection()
  if (!connection?.refresh_token) {
    throw new Error('Google Calendar not connected. Please connect the Pixelnoid Google account in Settings.')
  }

  const oauth2Client = createGoogleOAuthClient()
  oauth2Client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : undefined,
  })

  // Auto-save new tokens after refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token && tokens.expiry_date) {
      await updateStoredTokens(connection, tokens.access_token, tokens.expiry_date)
    }
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  return { calendar, connection }
}

/** Sanitize attendees: filter nulls, empty, duplicates, malformed */
function sanitizeAttendees(emails: (string | null | undefined)[]): { email: string }[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const seen = new Set<string>()
  return emails
    .filter((e): e is string => typeof e === 'string' && e.trim().length > 0 && emailRegex.test(e.trim()))
    .filter((e) => { const lc = e.toLowerCase(); if (seen.has(lc)) return false; seen.add(lc); return true })
    .map((e) => ({ email: e.trim() }))
}

/** Map recurrence string to Google Calendar RRULE */
function buildRecurrenceRules(recurrence?: string | null): string[] {
  if (!recurrence || recurrence === 'none') return []
  const map: Record<string, string> = {
    daily: 'RRULE:FREQ=DAILY',
    weekly: 'RRULE:FREQ=WEEKLY',
    monthly: 'RRULE:FREQ=MONTHLY',
    weekdays: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  }
  return map[recurrence] ? [map[recurrence]] : []
}

/** Map color name to Google Calendar colorId (1–11) */
function colorIdFromName(color?: string | null): string | undefined {
  if (!color) return undefined
  const map: Record<string, string> = {
    tomato: '11', flamingo: '4', tangerine: '6', banana: '5',
    sage: '2', basil: '10', peacock: '7', blueberry: '9',
    lavender: '1', grape: '3', graphite: '8',
  }
  return map[color]
}

/** Build a Google Calendar event body from a teaching schedule */
function buildEventBody(schedule: {
  title: string
  description?: string | null
  start_at: string
  end_at: string
  is_all_day?: boolean | null
  recurrence?: string | null
  location?: string | null
  meet_link?: string | null
  mentor_email?: string | null
  student_emails?: string[] | null
  guest_emails?: string[] | null
  guest_permissions?: { modify?: boolean; invite?: boolean; see_list?: boolean } | null
  notifications?: { type: string; minutes: number }[] | null
  color?: string | null
  status?: string | null
  visibility?: string | null
}) {
  const rawEmails = [
    schedule.mentor_email,
    ...(schedule.student_emails ?? []),
    ...(schedule.guest_emails ?? []),
  ]
  const attendees = sanitizeAttendees(rawEmails)

  // Build start/end — support all-day events (date only)
  const startField = schedule.is_all_day
    ? { date: schedule.start_at.substring(0, 10) }
    : { dateTime: schedule.start_at, timeZone: 'Asia/Jakarta' }
  const endField = schedule.is_all_day
    ? { date: schedule.end_at.substring(0, 10) }
    : { dateTime: schedule.end_at, timeZone: 'Asia/Jakarta' }

  // Build reminders from notifications
  const reminders = schedule.notifications?.length
    ? {
        useDefault: false,
        overrides: schedule.notifications.map((n) => ({
          method: n.type === 'popup' ? 'popup' : 'email',
          minutes: n.minutes,
        })),
      }
    : { useDefault: true }

  // Guest permissions
  const gp = schedule.guest_permissions ?? {}

  const body: Record<string, any> = {
    summary: schedule.title,
    description: schedule.description ?? '',
    start: startField,
    end: endField,
    attendees,
    recurrence: buildRecurrenceRules(schedule.recurrence),
    reminders,
    guestCanModify: gp.modify ?? false,
    guestCanInviteOthers: gp.invite ?? true,
    guestCanSeeOtherGuests: gp.see_list ?? true,
  }

  if (schedule.location) body.location = schedule.location
  if (schedule.color) body.colorId = colorIdFromName(schedule.color)
  if (schedule.visibility && schedule.visibility !== 'default') body.visibility = schedule.visibility
  if (schedule.status === 'free') body.transparency = 'transparent'

  // Inject Google Meet conference link if provided (manual entry)
  if (schedule.meet_link) {
    body.description = (body.description ? body.description + '\n\n' : '') + `🎥 Google Meet: ${schedule.meet_link}`
  }

  return body
}

/** Create a Google Calendar event for a new schedule */
export async function syncCreateEvent(scheduleId: string) {
  const db = getAdminClient()
  const { data: schedule, error } = await db
    .from('teaching_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single()

  if (error || !schedule) {
    throw new Error(`Schedule not found: ${scheduleId}`)
  }

  // Anti-duplicate: if already synced, update instead
  if (schedule.google_event_id) {
    return syncUpdateEvent(scheduleId)
  }

  try {
    const { calendar, connection } = await getAuthenticatedCalendar()
    const calendarId = connection.google_calendar_id || 'primary'
    const event = buildEventBody(schedule)

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: 'all',
    })

    const googleEventId = response.data.id!
    await updateScheduleSyncStatus(scheduleId, 'synced', googleEventId, null)
    return { success: true, googleEventId }
  } catch (err: any) {
    const msg = err?.message ?? 'Unknown Google Calendar error'
    await updateScheduleSyncStatus(scheduleId, 'failed', null, msg)
    return { success: false, error: msg }
  }
}

/** Update an existing Google Calendar event */
export async function syncUpdateEvent(scheduleId: string) {
  const db = getAdminClient()
  const { data: schedule, error } = await db
    .from('teaching_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single()

  if (error || !schedule) throw new Error(`Schedule not found: ${scheduleId}`)

  // If no event exists yet, create instead
  if (!schedule.google_event_id) {
    return syncCreateEvent(scheduleId)
  }

  try {
    const { calendar, connection } = await getAuthenticatedCalendar()
    const calendarId = connection.google_calendar_id || 'primary'
    const event = buildEventBody(schedule)

    await calendar.events.update({
      calendarId,
      eventId: schedule.google_event_id,
      requestBody: event,
      sendUpdates: 'all',
    })

    await updateScheduleSyncStatus(scheduleId, 'synced', schedule.google_event_id, null)
    return { success: true }
  } catch (err: any) {
    const msg = err?.message ?? 'Unknown Google Calendar error'
    await updateScheduleSyncStatus(scheduleId, 'failed', schedule.google_event_id, msg)
    return { success: false, error: msg }
  }
}

/** Delete a Google Calendar event */
export async function syncDeleteEvent(scheduleId: string) {
  const db = getAdminClient()
  const { data: schedule } = await db
    .from('teaching_schedules')
    .select('google_event_id')
    .eq('id', scheduleId)
    .single()

  if (!schedule?.google_event_id) return { success: true } // Nothing to delete

  try {
    const { calendar, connection } = await getAuthenticatedCalendar()
    const calendarId = connection.google_calendar_id || 'primary'

    await calendar.events.delete({
      calendarId,
      eventId: schedule.google_event_id,
      sendUpdates: 'all',
    })
    return { success: true }
  } catch (err: any) {
    // 404 = already deleted on Google side; treat as success
    if (err?.code === 404 || err?.status === 404) return { success: true }
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}
