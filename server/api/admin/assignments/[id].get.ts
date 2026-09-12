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
    throw createError({ statusCode: 400, statusMessage: 'ID tugas diperlukan.' })
  }

  try {
    const { data: assignment, error } = await client
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
      .eq('id', id)
      .single()

    if (error || !assignment) {
      throw createError({ statusCode: 404, statusMessage: 'Tugas tidak ditemukan.' })
    }

    return { assignment }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Internal Server Error'
    })
  }
})
