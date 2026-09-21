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

  // Ambil bukti_foto sebelum dihapus
  const { data: row } = await client
    .from('absensi')
    .select('bukti_foto')
    .eq('id', id)
    .single()

  // Hapus foto dari storage jika ada
  if (row?.bukti_foto) {
    try {
      const url = new URL(row.bukti_foto)
      // Path di storage: segmen setelah "/object/public/absensi/"
      const match = url.pathname.match(/\/object\/public\/absensi\/(.+)/)
      if (match?.[1]) {
        await client.storage.from('absensi').remove([decodeURIComponent(match[1])])
      }
    } catch (_) {
      // Abaikan error storage, lanjut hapus record
    }
  }

  // Hapus absensi (relasi di absensi_students otomatis terhapus karena ON DELETE CASCADE)
  const { error } = await client
    .from('absensi')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal menghapus absensi: ${error.message}`
    })
  }

  return {
    success: true,
    message: 'Data absensi berhasil dihapus.'
  }
})
