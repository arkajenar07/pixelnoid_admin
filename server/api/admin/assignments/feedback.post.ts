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
  const body = await readBody(event)

  const { student_assignment_id, feedback, grade, feedback_by, status } = body

  if (!student_assignment_id) {
    throw createError({ statusCode: 400, statusMessage: 'ID pengumpulan tugas siswa diperlukan.' })
  }

  try {
    const updatePayload: any = {
      feedback: feedback !== undefined ? feedback.trim() : null,
      grade: grade !== undefined && grade !== '' ? Number(grade) : null,
      feedback_by: feedback_by || null,
      feedback_at: new Date().toISOString(),
      status: status || 'reviewed'
    }

    const { data, error } = await client
      .from('student_assignments')
      .update(updatePayload)
      .eq('id', student_assignment_id)
      .select(`
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
      `)
      .single()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: `Gagal menyimpan feedback: ${error.message}` })
    }

    return {
      message: 'Feedback mentor berhasil disimpan!',
      submission: data
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Internal Server Error'
    })
  }
})
