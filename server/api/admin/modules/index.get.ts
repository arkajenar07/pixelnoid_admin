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
  const query = getQuery(event)
  const classId = query.class_id ? Number(query.class_id) : null

  let queryBuilder = client
    .from('class_modules')
    .select(`
      id, title, slug, description, thumbnail_url, xp_reward,
      estimated_minutes, sort_order, is_locked_default, is_published,
      class_id, created_at,
      module_lessons (
        id, title, slug, type, video_url, sort_order, created_at,
        content, xp_reward
      )
    `)
    .order('sort_order', { ascending: true })
    .order('sort_order', { referencedTable: 'module_lessons', ascending: true })

  if (classId) {
    queryBuilder = queryBuilder.eq('class_id', classId)
  }

  const { data, error } = await queryBuilder

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal mengambil modul: ${error.message}` })
  }

  return { modules: data ?? [] }
})
