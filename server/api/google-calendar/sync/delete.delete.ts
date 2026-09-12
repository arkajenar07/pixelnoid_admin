// server/api/google-calendar/sync/delete.delete.ts
import { syncDeleteEvent } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const { scheduleId } = await readBody(event)
  if (!scheduleId) throw createError({ statusCode: 400, statusMessage: 'scheduleId required' })
  return syncDeleteEvent(scheduleId)
})
