import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  const config = useRuntimeConfig()
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  if (!serviceRoleKey || !supabaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi server Supabase tidak lengkap.' })
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default defineEventHandler(async () => {
  const client = makeAdminClient()

  // 1. Ambil data absensi utama
  const { data: absensiList, error: absensiError } = await client
    .from('absensi')
    .select('*')
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (absensiError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mengambil data absensi: ${absensiError.message}`
    })
  }

  // 2. Ambil seluruh data absensi_students beserta student
  const absensiIds = (absensiList ?? []).map(a => a.id)
  let absensiStudentsMap = new Map<number, string[]>()

  if (absensiIds.length > 0) {
    const { data: studentRows, error: studentRowsError } = await client
      .from('absensi_students')
      .select('absensi_id, student_id')
      .in('absensi_id', absensiIds)

    if (!studentRowsError && studentRows) {
      for (const row of studentRows) {
        const list = absensiStudentsMap.get(row.absensi_id) || []
        list.push(row.student_id)
        absensiStudentsMap.set(row.absensi_id, list)
      }
    }
  }

  // 3. Ambil data mentor dan student dari users
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

  // 4. Format data absensi dengan objek mentor dan list objek student
  const mergedAbsensi = (absensiList ?? []).map((abs: any) => {
    const mentor = abs.mentor_id ? userMap.get(String(abs.mentor_id)) || null : null
    const studentIds = absensiStudentsMap.get(abs.id) || []
    const attendedStudents = studentIds
      .map(sId => userMap.get(String(sId)))
      .filter(Boolean)

    return {
      ...abs,
      mentor,
      students: attendedStudents,
      student_ids: studentIds
    }
  })

  return {
    absensi: mergedAbsensi,
    mentors,
    students
  }
})
