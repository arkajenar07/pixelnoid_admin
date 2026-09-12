// server/api/google-calendar/calendars.get.ts
// Lists all Google Calendars accessible by the connected Pixelnoid account

import { getAuthenticatedCalendar } from '../../utils/google-calendar'

export default defineEventHandler(async (_event) => {
  try {
    const { calendar } = await getAuthenticatedCalendar()
    const { data } = await calendar.calendarList.list()

    const calendars = (data.items ?? []).map((c) => ({
      id: c.id,
      summary: c.summary,
      primary: c.primary ?? false,
    }))

    return { calendars }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err?.message ?? 'Failed to list Google Calendars.',
    })
  }
})
