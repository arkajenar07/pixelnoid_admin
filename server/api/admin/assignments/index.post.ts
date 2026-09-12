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

  const { title, description, type, link_url, due_date, student_ids, created_by } = body

  if (!title || !type) {
    throw createError({ statusCode: 400, statusMessage: 'Judul tugas dan tipe tugas wajib diisi.' })
  }

  const validTypes = ['quizizz', 'practice', 'case_study']
  if (!validTypes.includes(type)) {
    throw createError({ statusCode: 400, statusMessage: `Tipe tugas tidak valid. Pilih antara: ${validTypes.join(', ')}` })
  }

  try {
    // 1. Insert Assignment Master
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .insert({
        title: title.trim(),
        description: description ? description.trim() : null,
        type,
        link_url: link_url ? link_url.trim() : null,
        due_date: due_date || null,
        created_by: created_by || null,
      })
      .select()
      .single()

    if (assignmentError) {
      throw createError({ statusCode: 500, statusMessage: `Gagal membuat tugas: ${assignmentError.message}` })
    }

    const assignmentId = assignmentData.id

    // 2. Batch assign to students if student_ids provided
    if (Array.isArray(student_ids) && student_ids.length > 0) {
      const distinctStudentIds = Array.from(new Set(student_ids))
      const studentAssignmentsPayload = distinctStudentIds.map((studentId: string) => ({
        assignment_id: assignmentId,
        student_id: studentId,
        status: 'pending'
      }))

      const { error: assignError } = await client
        .from('student_assignments')
        .insert(studentAssignmentsPayload)

      if (assignError) {
        console.error('Error assigning students:', assignError)
        // Note: Assignment is already created, but return warning
      }
    }

    return {
      message: 'Tugas berhasil dibuat!',
      assignment: assignmentData
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Internal Server Error'
    })
  }
})
