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
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID modul diperlukan.' })

  const { title, description, slug, thumbnail_url, xp_reward, estimated_minutes, sort_order, is_locked_default, is_published } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (slug !== undefined) updates.slug = slug
  if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url
  if (xp_reward !== undefined) updates.xp_reward = xp_reward
  if (estimated_minutes !== undefined) updates.estimated_minutes = estimated_minutes
  if (sort_order !== undefined) updates.sort_order = sort_order
  if (is_locked_default !== undefined) updates.is_locked_default = is_locked_default
  if (is_published !== undefined) updates.is_published = is_published

  const { data, error } = await client
    .from('class_modules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal mengupdate modul: ${error.message}` })
  }

  return { module: data }
})
