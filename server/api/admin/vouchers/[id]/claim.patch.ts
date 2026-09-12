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

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Set the status to 'claimed'
  const { data, error } = await adminClient
    .from('vouchers')
    .update({ status: 'claimed' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui status claim voucher: ${error.message}`,
    })
  }

  return { voucher: data }
})
