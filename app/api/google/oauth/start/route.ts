import { NextResponse } from 'next/server';
import { getGoogleConfig, isOAuthConfigured } from '@/lib/google/config';
import { buildAuthorizationUrl, generateOAuthState } from '@/lib/google/oauth';
import { GOOGLE_STATE_COOKIE, STATE_MAX_AGE_SECONDS, sessionCookieOptions } from '@/lib/google/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/google/oauth/start -> redirects the browser to Google's consent screen.
export async function GET() {
  try {
    const config = getGoogleConfig();
    if (!isOAuthConfigured(config)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI (or APP_URL).',
          code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
        },
        { status: 500 },
      );
    }

    const state = generateOAuthState();
    const authUrl = buildAuthorizationUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      state,
    });

    const res = NextResponse.redirect(authUrl);
    res.cookies.set(GOOGLE_STATE_COOKIE, state, sessionCookieOptions(STATE_MAX_AGE_SECONDS));
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start Google OAuth.';
    return NextResponse.json({ success: false, message, code: 'GOOGLE_OAUTH_START_FAILED' }, { status: 500 });
  }
}
