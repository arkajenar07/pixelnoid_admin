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

  const body = await readBody(event)
  const { voucher_holder, benefits, status, unique_code } = body

  if (!voucher_holder || !unique_code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'voucher_holder dan unique_code wajib diisi.',
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
    .insert([
      {
        voucher_holder,
        benefits: benefits || '',
        status: status || 'available',
        unique_code
      }
    ])
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal membuat voucher: ${error.message}`,
    })
  }

  return { voucher: data }
})
