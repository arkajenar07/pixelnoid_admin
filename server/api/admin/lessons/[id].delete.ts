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

  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lesson diperlukan.' })

  const { data: existingLesson } = await client
    .from('module_lessons')
    .select('module_id')
    .eq('id', id)
    .single()

  const { error } = await client
    .from('module_lessons')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Gagal menghapus lesson: ${error.message}` })
  }

  // Recalculate module total XP
  if (existingLesson?.module_id) {
    const { data: allLessons } = await client
      .from('module_lessons')
      .select('xp_reward')
      .eq('module_id', existingLesson.module_id)

    const totalXp = (allLessons || []).reduce((sum, l) => sum + (Number(l.xp_reward) || 0), 0)

    await client
      .from('class_modules')
      .update({ xp_reward: totalXp })
      .eq('id', existingLesson.module_id)
  }

  return { success: true }
})
