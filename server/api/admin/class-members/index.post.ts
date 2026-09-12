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
  const client = makeAdminClient()
  const body = await readBody(event)
  const { user_id, class_id } = body

  if (!user_id || !class_id) {
    throw createError({ statusCode: 400, statusMessage: 'user_id dan class_id wajib diisi.' })
  }

  // Check for duplicate
  const { data: existing } = await client
    .from('class_member')
    .select('id')
    .eq('user_id', user_id)
    .eq('class_id', class_id)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Student ini sudah terdaftar di kelas tersebut.' })
  }

  const { data, error } = await client
    .from('class_member')
    .insert([{ user_id, class_id }])
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal mendaftarkan: ${error.message}` })
  }

  return { member: data }
})
