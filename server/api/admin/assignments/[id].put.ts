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
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID tugas diperlukan.' })
  }

  const { title, description, type, link_url, due_date, student_ids } = body

  try {
    // 1. Update assignment master
    const updatePayload: any = {}
    if (title !== undefined) updatePayload.title = title.trim()
    if (description !== undefined) updatePayload.description = description ? description.trim() : null
    if (type !== undefined) updatePayload.type = type
    if (link_url !== undefined) updatePayload.link_url = link_url ? link_url.trim() : null
    if (due_date !== undefined) updatePayload.due_date = due_date || null

    const { data: updatedAssignment, error: updateError } = await client
      .from('assignments')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw createError({ statusCode: 500, statusMessage: `Gagal memperbarui tugas: ${updateError.message}` })
    }

    // 2. If student_ids provided, sync assignments (add new ones without destroying existing submissions)
    if (Array.isArray(student_ids)) {
      // Get existing student_assignments
      const { data: existingRows } = await client
        .from('student_assignments')
        .select('student_id')
        .eq('assignment_id', id)

      const existingIds = new Set((existingRows || []).map((r: any) => r.student_id))
      const targetIds = new Set(student_ids)

      // Find new student IDs to insert
      const newStudentIds = student_ids.filter((sId: string) => !existingIds.has(sId))
      if (newStudentIds.length > 0) {
        const insertPayload = newStudentIds.map((sId: string) => ({
          assignment_id: Number(id),
          student_id: sId,
          status: 'pending'
        }))
        await client.from('student_assignments').insert(insertPayload)
      }

      // Find unassigned student IDs to remove (HANYA jika status masih 'pending' - jangan hapus yang sudah submit/review)
      const removedStudentIds = Array.from(existingIds).filter((sId: string) => !targetIds.has(sId))
      if (removedStudentIds.length > 0) {
        await client
          .from('student_assignments')
          .delete()
          .eq('assignment_id', id)
          .eq('status', 'pending')
          .in('student_id', removedStudentIds)
      }
    }

    return {
      message: 'Tugas berhasil diperbarui!',
      assignment: updatedAssignment
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Internal Server Error'
    })
  }
})
