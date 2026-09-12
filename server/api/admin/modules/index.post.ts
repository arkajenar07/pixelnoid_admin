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
  const { title, description, class_id, slug, thumbnail_url, xp_reward, estimated_minutes, sort_order, is_locked_default, is_published } = body

  if (!title || !class_id) {
    throw createError({ statusCode: 400, statusMessage: 'title dan class_id wajib diisi.' })
  }

  const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data, error } = await client
    .from('class_modules')
    .insert([{
      title,
      slug: generatedSlug,
      description: description || '',
      class_id,
      thumbnail_url: thumbnail_url || null,
      xp_reward: xp_reward || 0,
      estimated_minutes: estimated_minutes || 0,
      sort_order: sort_order ?? 0,
      is_locked_default: is_locked_default ?? false,
      is_published: is_published ?? false,
    }])
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal membuat modul: ${error.message}` })
  }

  return { module: data }
})
