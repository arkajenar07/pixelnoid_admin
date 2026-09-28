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

export default defineEventHandler(async (event) => {
  const client = makeAdminClient()
  const query = getQuery(event)
  const classId = query.class_id ? Number(query.class_id) : null

  // 1. Fetch all classes
  let classQuery = client
    .from('class')
    .select('id, name')
    .order('id', { ascending: true })
  if (classId) classQuery = classQuery.eq('id', classId)
  const { data: classes, error: classError } = await classQuery
  if (classError) throw createError({ statusCode: 500, statusMessage: classError.message })

  // 2. Fetch class_member to know which students are in which class
  let memberQuery = client
    .from('class_member')
    .select('user_id, class_id, users(id, fullname, username)')
  if (classId) memberQuery = memberQuery.eq('class_id', classId)
  const { data: members, error: memberError } = await memberQuery
  if (memberError) throw createError({ statusCode: 500, statusMessage: memberError.message })

  // 3. Fetch all absensi sessions with their class info
  let absensiQuery = client
    .from('absensi')
    .select('id, class_id, session_date, title')
  if (classId) absensiQuery = absensiQuery.eq('class_id', classId)
  const { data: absensiList, error: absensiError } = await absensiQuery
  if (absensiError) throw createError({ statusCode: 500, statusMessage: absensiError.message })

  // 4. Fetch all absensi_students (who attended which session)
  const absensiIds = (absensiList ?? []).map((a: any) => a.id)
  let attendanceMap: Record<string, Set<number>> = {} // student_id -> Set of absensi_ids they attended

  if (absensiIds.length > 0) {
    const { data: attendanceRows, error: attError } = await client
      .from('absensi_students')
      .select('absensi_id, student_id')
      .in('absensi_id', absensiIds)
    if (!attError && attendanceRows) {
      for (const row of attendanceRows) {
        if (!attendanceMap[row.student_id]) attendanceMap[row.student_id] = new Set()
        attendanceMap[row.student_id].add(row.absensi_id)
      }
    }
  }

  // 5. Build result grouped by class
  const classMap: Record<number, { id: number; name: string; students: any[] }> = {}

  for (const cls of (classes ?? [])) {
    // Total sessions for this class
    const classSessions = (absensiList ?? []).filter((a: any) => a.class_id === cls.id)
    const totalSessions = classSessions.length

    // Students in this class
    const classMembers = (members ?? []).filter((m: any) => m.class_id === cls.id)

    const studentRows = classMembers.map((m: any) => {
      const studentId = m.user_id
      const attended = attendanceMap[studentId] 
        ? [...(attendanceMap[studentId] as Set<number>)].filter(id => classSessions.some((s: any) => s.id === id)).length
        : 0
      const progressPct = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0

      return {
        id: studentId,
        fullname: m.users?.fullname || m.users?.username || 'Unknown',
        attended,
        totalSessions,
        progressPct
      }
    })

    // Average progress for this class
    const avgProgress = studentRows.length > 0
      ? Math.round(studentRows.reduce((sum, s) => sum + s.progressPct, 0) / studentRows.length)
      : 0

    classMap[cls.id] = {
      id: cls.id,
      name: cls.name,
      students: studentRows.sort((a, b) => b.progressPct - a.progressPct),
      // @ts-ignore
      avgProgress,
      totalSessions
    }
  }

  return { classes: Object.values(classMap) }
})
