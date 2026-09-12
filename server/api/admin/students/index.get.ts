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

export default defineEventHandler(async (_event) => {
  const client = makeAdminClient()

  // Only fetch users with roles array containing 'student'
  const { data, error } = await client
    .from('users')
    .select('id, fullname, username')
    .contains('roles', ['student'])
    .order('fullname', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal mengambil data student: ${error.message}` })
  }

  return { students: data ?? [] }
})
