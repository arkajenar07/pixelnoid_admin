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
  const { modules, lessons } = body

  // 1. Batch update modules sort_order
  if (Array.isArray(modules) && modules.length > 0) {
    const moduleUpdates = modules.map((m: { id: number; sort_order: number }) =>
      client
        .from('class_modules')
        .update({ sort_order: m.sort_order })
        .eq('id', m.id)
    )
    const results = await Promise.all(moduleUpdates)
    const failed = results.find(r => r.error)
    if (failed?.error) {
      throw createError({ statusCode: 500, statusMessage: `Gagal menyimpan urutan modul: ${failed.error.message}` })
    }
  }

  // 2. Batch update lessons sort_order
  if (Array.isArray(lessons) && lessons.length > 0) {
    const lessonUpdates = lessons.map((l: { id: number; sort_order: number }) =>
      client
        .from('module_lessons')
        .update({ sort_order: l.sort_order })
        .eq('id', l.id)
    )
    const results = await Promise.all(lessonUpdates)
    const failed = results.find(r => r.error)
    if (failed?.error) {
      throw createError({ statusCode: 500, statusMessage: `Gagal menyimpan urutan lesson: ${failed.error.message}` })
    }
  }

  return { success: true, message: 'Urutan berhasil disimpan.' }
})
