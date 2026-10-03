import { NextRequest, NextResponse } from 'next/server';
import { getGoogleConfig } from '@/lib/google/config';
import { revokeToken } from '@/lib/google/oauth';
import { clearSessionCookie } from '@/lib/google/auth';
import { GOOGLE_SESSION_COOKIE, unsealSession } from '@/lib/google/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/google/disconnect -> revokes the visitor's OAuth grant and clears the cookie.
export async function POST(req: NextRequest) {
  let revoked = false;
  try {
    const config = getGoogleConfig();
    const session = unsealSession(req.cookies.get(GOOGLE_SESSION_COOKIE)?.value, config.tokenSecret);
    const token = session?.refreshToken || session?.accessToken;
    if (token) {
      await revokeToken(token);
      revoked = true;
    }
  } catch (error) {
    // Still clear the local cookie even if Google already considers the token invalid.
    console.error('Google token revocation failed:', error);
  }
  const res = NextResponse.json({ success: true, revoked });
  clearSessionCookie(res);
  return res;
}
