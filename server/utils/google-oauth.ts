// server/utils/google-oauth.ts
// Server-only utility — never import this in client code
import { google } from 'googleapis'

export function createGoogleOAuthClient() {
  const config = useRuntimeConfig()

  return new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri
  )
}

export function generateAuthUrl(
  oauth2Client: ReturnType<typeof createGoogleOAuthClient>,
  state: string
) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state,
    // Only request the scope that is approved in Google Cloud Console
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
    ],
  })
}
