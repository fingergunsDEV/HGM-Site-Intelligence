import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getGoogleConfig, isOAuthConfigured } from '@/lib/google/config';
import { exchangeCodeForTokens } from '@/lib/google/oauth';
import { applySessionCookie } from '@/lib/google/auth';
import { GOOGLE_STATE_COOKIE, sessionCookieOptions } from '@/lib/google/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Redirects back into the app without the authorization code in the URL, as Google
 * recommends, carrying only a short status flag for the UI.
 */
function redirectToApp(req: NextRequest, status: string): NextResponse {
  // Prefer the public origin of the registered redirect URI; behind a proxy (Cloud Run)
  // req.nextUrl.origin can be the internal host.
  let origin = req.nextUrl.origin;
  try {
    const redirectUri = getGoogleConfig().redirectUri;
    if (redirectUri) origin = new URL(redirectUri).origin;
  } catch {
    // keep request origin
  }
  const target = new URL('/', origin);
  target.searchParams.set('google', status);
  const res = NextResponse.redirect(target);
  res.cookies.set(GOOGLE_STATE_COOKIE, '', sessionCookieOptions(0));
  return res;
}

// GET /api/google/oauth/callback?code=...&state=...
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const error = params.get('error');
  if (error) return redirectToApp(req, error === 'access_denied' ? 'denied' : 'error');

  const code = params.get('code') || '';
  const state = params.get('state') || '';
  const expectedState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value || '';
  if (!code || !state || !expectedState || !safeEqual(state, expectedState)) {
    return redirectToApp(req, 'state_mismatch');
  }

  const config = getGoogleConfig();
  if (!isOAuthConfigured(config)) return redirectToApp(req, 'not_configured');

  try {
    const token = await exchangeCodeForTokens({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
    });
    const res = redirectToApp(req, 'connected');
    applySessionCookie(
      res,
      {
        accessToken: token.access_token,
        expiresAt: Date.now() + token.expires_in * 1000,
        refreshToken: token.refresh_token,
        scope: token.scope,
      },
      config.tokenSecret,
    );
    return res;
  } catch (err) {
    console.error('Google OAuth code exchange failed:', err);
    return redirectToApp(req, 'error');
  }
}
