import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''

  if (!serviceRoleKey || !supabaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi server tidak lengkap.' })
  }

  const body = await readBody(event)
  const { type, category, description, payment_metode, class: className, amount, notes, status } = body

  if (!type || !category || !amount || !status) {
    throw createError({ statusCode: 400, statusMessage: 'Field type, category, amount, dan status wajib diisi.' })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await adminClient
    .from('financial')
    .insert([{ type, category, description, payment_metode, class: className, amount: Number(amount), notes, status }])
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal membuat data financial: ${error.message}` })
  }

  return { success: true, message: 'Data finansial berhasil ditambahkan.', data }
})
