// server/api/google-calendar/status.get.ts
// Returns safe connection status — NEVER returns tokens

import { getCalendarConnection } from '../../utils/google-calendar-db'

export default defineEventHandler(async (_event) => {
  const connection = await getCalendarConnection()

  if (!connection) {
    return { connected: false }
  }

  return {
    connected: true,
    googleEmail: connection.google_email,
    calendarId: connection.google_calendar_id,
    calendarName: connection.google_calendar_name,
  }
})
