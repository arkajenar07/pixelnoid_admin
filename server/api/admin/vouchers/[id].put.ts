import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  const serviceRoleKey =
    config.supabaseServiceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''

  const supabaseUrl =
    config.supabaseUrl ||
    process.env.SUPABASE_URL ||
    process.env.NUXT_PUBLIC_SUPABASE_URL ||
    ''

  if (!serviceRoleKey || !supabaseUrl || !id) {
    throw createError({
      statusCode: 500,
      statusMessage: `Konfigurasi server tidak lengkap atau ID tidak valid.`,
    })
  }

  const body = await readBody(event)
  const { voucher_holder, benefits, status, unique_code } = body

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await adminClient
    .from('vouchers')
    .update({
      voucher_holder,
      benefits,
      status,
      unique_code
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui voucher: ${error.message}`,
    })
  }

  return { voucher: data }
})
