import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const serviceRoleKey =
    config.supabaseServiceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''

  const supabaseUrl =
    config.supabaseUrl ||
    process.env.SUPABASE_URL ||
    process.env.NUXT_PUBLIC_SUPABASE_URL ||
    ''

  if (!serviceRoleKey || !supabaseUrl) {
    const missing = []
    if (!supabaseUrl) missing.push('SUPABASE_URL')
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    throw createError({
      statusCode: 500,
      statusMessage: `Konfigurasi server tidak lengkap. Variabel yang hilang: ${missing.join(', ')}.`,
    })
  }

  // Admin client — bypass RLS sehingga bisa baca SEMUA user
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const [dbResult, authResult] = await Promise.all([
    adminClient.from('users').select('id,fullname,username,roles,avatar_url,created_at').order('created_at', { ascending: false }),
    adminClient.auth.admin.listUsers()
  ])

  if (dbResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mengambil data users: ${dbResult.error.message}`,
    })
  }

  const authUserMap = new Map(authResult.data.users.map(u => [u.id, u.email]))

  const mergedUsers = (dbResult.data ?? []).map(u => ({
    ...u,
    email: authUserMap.get(u.id) || null
  }))

  return { users: mergedUsers }
})
