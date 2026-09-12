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

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID resource tidak valid.' })
  }

  const body = await readBody(event)
  const { title, description, type, url, class_id } = body ?? {}

  if (!title || !title.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Judul resource wajib diisi.' })
  }

  if (!url || !url.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'URL resource wajib diisi.' })
  }

  const payload: Record<string, any> = {
    title: title.trim(),
    description: description ? description.trim() : null,
    type: type ? type.trim() : 'other',
    url: url.trim(),
    class_id: (class_id !== undefined && class_id !== null && class_id !== '') ? Number(class_id) : null
  }

  const { data, error } = await client
    .from('resources')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    let msg = error.message
    if (msg.includes('column') && msg.includes('class_id')) {
      msg = 'Kolom class_id belum ada di tabel resources database Supabase. Silakan jalankan sql/resources.sql di Supabase SQL Editor.'
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal memperbarui resource: ${msg}`
    })
  }

  return {
    success: true,
    message: 'Resource berhasil diperbarui!',
    resource: data
  }
})
