// server/api/google-calendar/sync/create.post.ts
import { syncCreateEvent } from '../../../utils/google-calendar'

export default defineEventHandler(async (event) => {
  const { scheduleId } = await readBody(event)
  if (!scheduleId) throw createError({ statusCode: 400, statusMessage: 'scheduleId required' })
  return syncCreateEvent(scheduleId)
})
