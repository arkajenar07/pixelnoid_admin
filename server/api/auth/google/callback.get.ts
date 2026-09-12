// server/api/auth/google/callback.get.ts
// Handles the Google OAuth callback after user authorization

import { createGoogleOAuthClient } from '../../../utils/google-oauth'
import { saveCalendarConnection } from '../../../utils/google-calendar-db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const state = query.state as string | undefined
  const googleError = query.error as string | undefined

  // --- Handle Google errors ---
  if (googleError) {
    const msg = encodeURIComponent('Google authorization was denied or failed. Please try again.')
    return sendRedirect(event, `/settings?error=${msg}`, 302)
  }

  if (!code) {
    const msg = encodeURIComponent('No authorization code received from Google.')
    return sendRedirect(event, `/settings?error=${msg}`, 302)
  }

  // --- Validate state (CSRF protection) ---
  const storedState = getCookie(event, 'google_oauth_state')
  deleteCookie(event, 'google_oauth_state')

  if (!storedState || storedState !== state) {
    const msg = encodeURIComponent('Invalid OAuth state. Please try connecting again.')
    return sendRedirect(event, `/settings?error=${msg}`, 302)
  }

  try {
    // --- Exchange code for tokens ---
    const oauth2Client = createGoogleOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      const msg = encodeURIComponent('No refresh token received. Please disconnect and reconnect to grant offline access.')
      return sendRedirect(event, `/settings?error=${msg}`, 302)
    }

    // --- Persist tokens server-side (tokens NEVER sent to browser) ---
    await saveCalendarConnection({
      google_email: 'Connected Account', // Since we removed the email scope to fix the permission issue
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? undefined,
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
    })

    return sendRedirect(event, '/settings?connected=1', 302)
  } catch (err: any) {
    console.error('[google/callback] Error:', err?.message)
    const msg = encodeURIComponent('Google Calendar connection failed. Please try again.')
    return sendRedirect(event, `/settings?error=${msg}`, 302)
  }
})
