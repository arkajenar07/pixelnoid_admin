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
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID kelas tidak valid.' })

  const client = makeAdminClient()

  // Guard: check if any class members are still registered
  const { count, error: countError } = await client
    .from('class_members')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', id)

  if (countError) {
    throw createError({ statusCode: 500, statusMessage: `Gagal memeriksa anggota kelas: ${countError.message}` })
  }

  if ((count ?? 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Kelas tidak bisa dihapus karena masih memiliki ${count} anggota terdaftar.`,
    })
  }

  const { error } = await client
    .from('class')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal menghapus kelas: ${error.message}` })
  }

  return { success: true }
})
