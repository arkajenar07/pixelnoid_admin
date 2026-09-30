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
  const body = await readBody(event)
  const { name, group_price, private_price } = body

  if (!name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nama kelas wajib diisi.' })
  }

  const client = makeAdminClient()

  const { data, error } = await client
    .from('class')
    .insert([{
      name: name.trim(),
      group_price: Number(group_price) || 0,
      private_price: Number(private_price) || 0,
    }])
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal membuat kelas: ${error.message}` })
  }

  return { class: data }
})
