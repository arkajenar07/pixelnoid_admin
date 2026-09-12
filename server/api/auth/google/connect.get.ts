// server/api/auth/google/connect.get.ts
// Initiates Google OAuth for the Pixelnoid master account
// Only accessible by admin users

import { createGoogleOAuthClient, generateAuthUrl } from '../../../utils/google-oauth'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL || ''
  const serviceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  // --- Get current user via @nuxtjs/supabase server client ---
  // serverSupabaseClient uses the user's session cookies automatically
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: userError } = await client.auth.getUser()

  if (userError || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Please log in first.' })
  }

  // --- Check admin role from custom users table (roles is text[]) ---
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  const roles: string[] = Array.isArray(profile?.roles) ? profile.roles : []

  if (!roles.includes('admin')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required.' })
  }

  // --- Generate and store OAuth state (CSRF protection) ---
  const state = randomBytes(32).toString('hex')

  setCookie(event, 'google_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  // --- Build Google OAuth URL with state ---
  const oauth2Client = createGoogleOAuthClient()
  const authUrl = generateAuthUrl(oauth2Client, state)

  await sendRedirect(event, authUrl, 302)
})
