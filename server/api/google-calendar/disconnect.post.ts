// server/api/google-calendar/disconnect.post.ts
// Removes OAuth credentials — keeps all schedule data and Google events intact

import { disconnectCalendar } from '../../utils/google-calendar-db'

export default defineEventHandler(async (_event) => {
  try {
    await disconnectCalendar()
    return { success: true }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message ?? 'Failed to disconnect.' })
  }
})
