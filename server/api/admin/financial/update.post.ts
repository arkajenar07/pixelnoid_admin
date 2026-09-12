import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''

  if (!serviceRoleKey || !supabaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi server tidak lengkap.' })
  }

  const body = await readBody(event)
  const { id, type, category, description, payment_metode, class: className, amount, notes, status } = body

  if (!id || !type || !category || !amount || !status) {
    throw createError({ statusCode: 400, statusMessage: 'Field id, type, category, amount, dan status wajib diisi.' })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await adminClient
    .from('financial')
    .update({ type, category, description, payment_metode, class: className, amount: Number(amount), notes, status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal update data financial: ${error.message}` })
  }

  return { success: true, message: 'Data finansial berhasil diperbarui.', data }
})
