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
  const query = getQuery(event)
  const typeFilter = query.type as string | undefined

  try {
    let q = client
      .from('assignments')
      .select(`
        id,
        title,
        description,
        type,
        link_url,
        due_date,
        created_by,
        created_at,
        updated_at,
        student_assignments (
          id,
          assignment_id,
          student_id,
          status,
          submission_url,
          submission_notes,
          submitted_at,
          grade,
          feedback,
          feedback_by,
          feedback_at,
          users!student_id (
            id,
            fullname,
            username,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (typeFilter) {
      q = q.eq('type', typeFilter)
    }

    const { data, error } = await q

    if (error) {
      throw createError({ statusCode: 500, statusMessage: `Gagal mengambil data tugas: ${error.message}` })
    }

    // Hitung statistik ringkasan tiap penugasan
    const assignments = (data ?? []).map((assignment: any) => {
      const subs = assignment.student_assignments || []
      const totalAssigned = subs.length
      const submittedCount = subs.filter((s: any) => s.status === 'submitted' || s.status === 'reviewed').length
      const pendingCount = subs.filter((s: any) => s.status === 'pending').length
      const reviewedCount = subs.filter((s: any) => s.status === 'reviewed').length

      return {
        ...assignment,
        stats: {
          totalAssigned,
          submittedCount,
          pendingCount,
          reviewedCount,
          completionRate: totalAssigned > 0 ? Math.round((submittedCount / totalAssigned) * 100) : 0
        }
      }
    })

    return { assignments }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Internal Server Error'
    })
  }
})
