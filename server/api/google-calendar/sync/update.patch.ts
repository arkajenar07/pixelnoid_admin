// server/api/google-calendar/sync/update.patch.ts
import { syncUpdateEvent } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const { scheduleId } = await readBody(event)
  if (!scheduleId) throw createError({ statusCode: 400, statusMessage: 'scheduleId required' })
  return syncUpdateEvent(scheduleId)
})
