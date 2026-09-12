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
    throw createError({
      statusCode: 500,
      statusMessage: `Konfigurasi server tidak lengkap.`,
    })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await adminClient
    .from('vouchers')
    .select('*')
    .order('id', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mengambil data vouchers: ${error.message}`,
    })
  }

  return { vouchers: data ?? [] }
})
