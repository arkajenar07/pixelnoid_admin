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

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lesson diperlukan.' })

  const { title, type, video_url, sort_order, content, slug, xp_reward } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) {
    updates.title = title
    updates.slug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  if (type !== undefined) updates.type = type
  if (video_url !== undefined) updates.video_url = video_url
  if (sort_order !== undefined) updates.sort_order = sort_order
  if (content !== undefined) updates.content = content
  if (xp_reward !== undefined) updates.xp_reward = Number(xp_reward) || 0

  const { data, error } = await client
    .from('module_lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal mengupdate lesson: ${error.message}` })
  }

  // Recalculate module total XP if xp_reward was updated
  let moduleTotalXp: number | null = null
  if (data?.module_id) {
    const { data: allLessons } = await client
      .from('module_lessons')
      .select('xp_reward')
      .eq('module_id', data.module_id)

    moduleTotalXp = (allLessons || []).reduce((sum, l) => sum + (Number(l.xp_reward) || 0), 0)

    await client
      .from('class_modules')
      .update({ xp_reward: moduleTotalXp })
      .eq('id', data.module_id)
  }

  return { lesson: data, module_total_xp: moduleTotalXp }
})
