import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const serviceRoleKey =
    config.supabaseServiceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''

  const supabaseUrl =
    config.supabaseUrl ||
    process.env.SUPABASE_URL ||
    process.env.NUXT_PUBLIC_SUPABASE_URL ||
    ''

  if (!serviceRoleKey || !supabaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Konfigurasi server tidak lengkap untuk Supabase Admin.',
    })
  }

  const body = await readBody(event)
  const { id, fullname, username, roles, avatar_url } = body

  if (!id || !fullname || !username || !roles?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Field id, fullname, username, dan roles wajib diisi.',
    })
  }

  // Admin client — bypass RLS untuk bisa update user manapun
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Update data ke tabel users
  const { error: dbError } = await adminClient
    .from('users')
    .update({
      fullname: fullname.trim(),
      username: username.trim(),
      roles: roles,
      avatar_url: avatar_url || null,
    })
    .eq('id', id)

  if (dbError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal update di tabel users: ${dbError.message}`,
    })
  }

  // Opsional: Jika kamu juga ingin mengupdate user_metadata di auth.users agar JWT/session tersinkronisasi
  const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
    user_metadata: {
      full_name: fullname.trim(),
      name: fullname.trim(),
      display_name: fullname.trim(),
      username: username.trim(),
      role: roles,
    }
  })

  if (authError) {
    console.warn('[update-user] Gagal update auth.users metadata:', authError.message)
    // Kita tidak melempar error keras di sini karena tabel utama berhasil
  }

  return {
    success: true,
    message: `Profil "${fullname}" berhasil diperbarui!`
  }
})
