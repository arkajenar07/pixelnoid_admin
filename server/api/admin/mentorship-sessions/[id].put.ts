import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  const config = useRuntimeConfig()
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  if (!serviceRoleKey || !supabaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi server tidak lengkap.' })
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default defineEventHandler(async (event) => {
  const client = makeAdminClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID sesi tidak valid.' })
  }

  const body = await readBody(event)
  const { mentor_id, student_id, topic, status, meeting_link, day, time, type } = body ?? {}

  if (!topic || !topic.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Topik sesi mentoring wajib diisi.' })
  }

  if (!mentor_id) {
    throw createError({ statusCode: 400, statusMessage: 'Mentor wajib dipilih.' })
  }

  if (!student_id) {
    throw createError({ statusCode: 400, statusMessage: 'Siswa wajib dipilih.' })
  }

  const payload: Record<string, any> = {
    topic: topic.trim(),
    mentor_id,
    student_id,
    type: type || 'main_class',
    status: status || 'Upcoming',
    meeting_link: meeting_link ? meeting_link.trim() : null,
    day: day ? day.trim() : null,
    time: time ? time.trim() : null,
  }

  const { data, error } = await client
    .from('mentorship_sessions')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    let message = error.message
    if (message.includes('invalid input syntax for type bigint')) {
      message = 'Kolom mentor_id/student_id di database masih bertipe bigint. Jalankan migration sql/mentorship_sessions.sql di Supabase SQL Editor agar kolom bertipe UUID.'
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui sesi mentoring: ${message}`
    })
  }

  return {
    success: true,
    message: 'Sesi mentoring berhasil diperbarui!',
    session: data
  }
})
