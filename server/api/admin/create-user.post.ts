import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Baca key dari runtimeConfig (yang di-feed dari env vars .env)
  // Wajib menggunakan SERVICE_ROLE_KEY, bukan ANON_KEY (SUPABASE_KEY)
  const serviceRoleKey =
    config.supabaseServiceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''

  // URL bisa dari SUPABASE_URL (standar) atau NUXT_PUBLIC_SUPABASE_URL (nuxtjs/supabase)
  const supabaseUrl =
    config.supabaseUrl ||
    process.env.SUPABASE_URL ||
    process.env.NUXT_PUBLIC_SUPABASE_URL ||
    ''

  if (!serviceRoleKey || !supabaseUrl) {
    const missing = []
    if (!supabaseUrl) missing.push('SUPABASE_URL')
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    throw createError({
      statusCode: 500,
      statusMessage:
        `Konfigurasi server tidak lengkap. Variabel yang hilang: ${missing.join(', ')}. ` +
        'Ambil SUPABASE_SERVICE_ROLE_KEY dari Supabase Dashboard → Project Settings → API → service_role (bukan anon key!).',
    })
  }

  // Baca body request dari frontend
  const body = await readBody(event)
  const { email, password, fullname, username, roles, avatar_url } = body

  // Validasi dasar di server
  if (!email || !password || !fullname || !username || !roles?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Field email, password, fullname, username, dan roles wajib diisi.',
    })
  }

  // Inisialisasi Supabase Admin Client dengan SERVICE_ROLE_KEY — HANYA di server!
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Step 1: Buat user di Supabase Auth dengan email_confirm: true
  // Akun langsung aktif tanpa perlu klik email verifikasi
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true, // ← bypass verifikasi email
    user_metadata: {
      full_name: fullname.trim(),
      name: fullname.trim(),
      display_name: fullname.trim(),
      username: username.trim(),
      role: roles,
    },
  })

  if (authError || !authData?.user) {
    throw createError({
      statusCode: 400,
      statusMessage: authError?.message ?? 'Gagal membuat akun di Supabase Auth.',
    })
  }

  const userId = authData.user.id

  // Step 2: Insert ke tabel manual `users` dengan UUID yang sama dari Auth
  // (Jika kamu sudah pakai Database Trigger, langkah ini bisa dilewati/dibuat idempotent)
  const { error: dbError } = await adminClient
    .from('users')
    .upsert({
      id: userId,
      fullname: fullname.trim(),
      username: username.trim(),
      roles: roles,
      avatar_url: avatar_url || null,
    })

  if (dbError) {
    // Auth sudah sukses, catat error DB tapi jangan rollback auth di sini
    // (jika ada trigger, baris ini mungkin sudah terisi — upsert mencegah duplikat)
    console.error('[create-user] DB insert error:', dbError.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Auth berhasil (UUID: ${userId}), tapi gagal sync ke tabel users: ${dbError.message}`,
    })
  }

  return {
    success: true,
    userId,
    message: `Akun "${fullname}" berhasil dibuat dan langsung aktif!`,
  }
})
