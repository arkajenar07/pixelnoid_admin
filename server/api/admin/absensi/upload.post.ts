import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  const config = useRuntimeConfig()
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  if (!serviceRoleKey || !supabaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi server Supabase tidak lengkap.' })
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default defineEventHandler(async (event) => {
  const client = makeAdminClient()

  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file yang diunggah.' })
  }

  const file = files.find(f => f.name === 'file' || f.filename)
  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'File bukti foto tidak valid.' })
  }

  // Pastikan bucket 'absensi' ada
  const bucketName = 'absensi'
  const { data: buckets } = await client.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === bucketName)
  if (!bucketExists) {
    await client.storage.createBucket(bucketName, { public: true })
  }

  // Buat nama file unik
  const extension = file.filename ? file.filename.split('.').pop() || 'jpg' : 'jpg'
  const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`
  const filePath = `proofs/${cleanName}`

  // Upload ke Supabase Storage
  const { data: uploadData, error: uploadError } = await client.storage
    .from(bucketName)
    .upload(filePath, file.data, {
      contentType: file.type || 'image/jpeg',
      upsert: true
    })

  if (uploadError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal mengunggah foto ke storage: ${uploadError.message}`
    })
  }

  // Dapatkan URL publik
  const { data: publicUrlData } = client.storage
    .from(bucketName)
    .getPublicUrl(uploadData.path)

  return {
    success: true,
    url: publicUrlData.publicUrl
  }
})
