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

  const { student_assignment_id, submission_url, submission_notes } = body

  if (!student_assignment_id || !submission_url) {
    throw createError({ statusCode: 400, statusMessage: 'ID tugas siswa dan Link pengumpulan wajib diisi.' })
  }

  // Basic URL validation
  let url = submission_url.trim()
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
  }

  try {
    const { data, error } = await client
      .from('student_assignments')
      .update({
        submission_url: url,
        submission_notes: submission_notes ? submission_notes.trim() : null,
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      })
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
      throw createError({ statusCode: 500, statusMessage: `Gagal upload link tugas: ${error.message}` })
    }

    return {
      message: 'Link tugas berhasil diupload!',
      submission: data
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Internal Server Error'
    })
  }
})
