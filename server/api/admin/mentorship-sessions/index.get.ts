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

  // 1. Ambil data sesi mentorship
  const { data: sessions, error: sessionsError } = await client
    .from('mentorship_sessions')
    .select('*')
    .order('id', { ascending: false })

  if (sessionsError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mengambil data mentorship_sessions: ${sessionsError.message}`
    })
  }

  // 2. Ambil list mentor & student dari public.users
  const [mentorsResult, studentsResult] = await Promise.all([
    client
      .from('users')
      .select('id, fullname, username, avatar_url, roles')
      .contains('roles', ['mentor'])
      .order('fullname', { ascending: true }),
    client
      .from('users')
      .select('id, fullname, username, avatar_url, roles')
      .contains('roles', ['student'])
      .order('fullname', { ascending: true }),
  ])

  const mentors = mentorsResult.data ?? []
  const students = studentsResult.data ?? []

  const userMap = new Map<string, any>()
  for (const m of mentors) userMap.set(String(m.id), m)
  for (const s of students) userMap.set(String(s.id), s)

  // 3. Pasangkan data profil mentor dan student ke tiap sesi
  const mergedSessions = (sessions ?? []).map((session: any) => {
    const mentor = session.mentor_id ? userMap.get(String(session.mentor_id)) : null
    const student = session.student_id ? userMap.get(String(session.student_id)) : null
    return {
      ...session,
      mentor: mentor || null,
      student: student || null
    }
  })

  return {
    sessions: mergedSessions,
    mentors,
    students
  }
})
