// server/api/google-calendar/select-calendar.post.ts
// Saves the admin's selected Google Calendar

import { updateSelectedCalendar } from '../../utils/google-calendar-db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { calendarId, calendarName } = body ?? {}

  if (!calendarId || typeof calendarId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'calendarId is required.' })
  }

  try {
    await updateSelectedCalendar(calendarId, calendarName ?? calendarId)
    return { success: true }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message ?? 'Failed to save calendar selection.' })
  }
})
