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
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID Absensi tidak valid.' })
  }

  const body = await readBody(event)
  const {
    mentor_id,
    student_ids,
    session_date,
    session_time,
    topic,
    bukti_foto,
    status,
    notes,
    rejection_reason,
    approved_by,
  } = body ?? {}

  // 1. Siapkan update payload untuk absensi
  const updatePayload: Record<string, any> = {}

  if (mentor_id !== undefined) updatePayload.mentor_id = mentor_id
  if (session_date !== undefined) updatePayload.session_date = session_date
  if (session_time !== undefined) updatePayload.session_time = session_time.trim()
  if (topic !== undefined) updatePayload.topic = topic ? topic.trim() : null
  if (bukti_foto !== undefined) updatePayload.bukti_foto = bukti_foto ? bukti_foto.trim() : null
  if (notes !== undefined) updatePayload.notes = notes ? notes.trim() : null
  if (rejection_reason !== undefined) updatePayload.rejection_reason = rejection_reason ? rejection_reason.trim() : null

  // Handle status approval transitions
  if (status !== undefined) {
    updatePayload.status = status
    if (status === 'approved') {
      updatePayload.approved_at = new Date().toISOString()
      if (approved_by) updatePayload.approved_by = approved_by
      updatePayload.rejection_reason = null
    } else if (status === 'rejected') {
      updatePayload.approved_at = null
      updatePayload.approved_by = null
    } else if (status === 'pending') {
      updatePayload.approved_at = null
      updatePayload.approved_by = null
      updatePayload.rejection_reason = null
    }
  }

  const { data: updatedAbsensi, error: updateError } = await client
    .from('absensi')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui absensi: ${updateError.message}`
    })
  }

  // 2. Jika student_ids disertakan, perbarui relasi absensi_students
  if (Array.isArray(student_ids)) {
    // Hapus relasi lama
    await client
      .from('absensi_students')
      .delete()
      .eq('absensi_id', id)

    // Masukkan relasi baru jika ada siswa
    if (student_ids.length > 0) {
      const studentRows = student_ids.map((sId: string) => ({
        absensi_id: id,
        student_id: sId
      }))

      const { error: studentInsertError } = await client
        .from('absensi_students')
        .insert(studentRows)

      if (studentInsertError) {
        throw createError({
          statusCode: 500,
          statusMessage: `Absensi diperbarui, namun gagal memperbarui relasi siswa: ${studentInsertError.message}`
        })
      }
    }
  }

  return {
    success: true,
    message: 'Data absensi berhasil diperbarui!',
    absensi: updatedAbsensi
  }
})
