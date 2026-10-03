import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_GOOGLE_SCOPES, GOOGLE_SCOPES, getGoogleConfig, isOAuthConfigured } from '@/lib/google/config';
import { hasScope } from '@/lib/google/oauth';
import { GOOGLE_SESSION_COOKIE, unsealSession } from '@/lib/google/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/google/status -> which credential modes are available (never returns secrets).
export async function GET(req: NextRequest) {
  try {
    const config = getGoogleConfig();
    const session = unsealSession(req.cookies.get(GOOGLE_SESSION_COOKIE)?.value, config.tokenSecret);
    const grantedScopes = session?.scope;

    return NextResponse.json({
      success: true,
      oauthConfigured: isOAuthConfigured(config),
      oauthConnected: Boolean(session),
      envRefreshTokenConfigured: Boolean(config.envRefreshToken),
      serviceAccountConfigured: Boolean(config.serviceAccount),
      serviceAccountEmail: config.serviceAccount?.clientEmail || null,
      requestedScopes: DEFAULT_GOOGLE_SCOPES,
      grantedScopes: grantedScopes ? grantedScopes.split(' ') : [],
      analyticsGranted: session ? hasScope(grantedScopes, GOOGLE_SCOPES.analyticsReadonly) : null,
      searchConsoleGranted: session ? hasScope(grantedScopes, GOOGLE_SCOPES.webmastersReadonly) : null,
      defaults: {
        ga4PropertyId: config.ga4PropertyId || null,
        gscSiteUrl: config.gscSiteUrl || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read Google integration status.';
    return NextResponse.json({ success: false, message, code: 'GOOGLE_CONFIG_ERROR' }, { status: 500 });
  }
}
