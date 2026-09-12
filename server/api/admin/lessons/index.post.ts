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
  const { module_id, title, type, video_url, sort_order, content, xp_reward } = body

  if (!module_id || !title) {
    throw createError({ statusCode: 400, statusMessage: 'module_id dan title wajib diisi.' })
  }

  const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data, error } = await client
    .from('module_lessons')
    .insert([{
      module_id,
      title,
      slug: generatedSlug,
      type: type || 'text',
      video_url: video_url || null,
      sort_order: sort_order ?? 0,
      content: content || [],
      xp_reward: Number(xp_reward) || 0,
    }])
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal membuat lesson: ${error.message}` })
  }

  // Recalculate module total XP
  if (data?.module_id) {
    const { data: allLessons } = await client
      .from('module_lessons')
      .select('xp_reward')
      .eq('module_id', data.module_id)

    const totalXp = (allLessons || []).reduce((sum, l) => sum + (Number(l.xp_reward) || 0), 0)

    await client
      .from('class_modules')
      .update({ xp_reward: totalXp })
      .eq('id', data.module_id)
  }

  return { lesson: data }
})
