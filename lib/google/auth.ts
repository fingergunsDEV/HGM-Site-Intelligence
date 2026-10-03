/**
 * Resolves a Google access token for an incoming API request and wraps route handlers
 * with consistent error handling. Server-side only.
 *
 * Credential priority:
 *  1. The visitor's OAuth session cookie (from "Connect Google"), refreshed when expired
 *  2. GOOGLE_REFRESH_TOKEN env var (server-wide OAuth connection)
 *  3. Service account (GOOGLE_SERVICE_ACCOUNT_KEY_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleConfig, GoogleIntegrationConfig, isOAuthConfigured } from './config';
import { GoogleApiError } from './http';
import { getServiceAccountAccessToken, refreshAccessToken } from './oauth';
import {
  GOOGLE_SESSION_COOKIE,
  GoogleOAuthSession,
  SESSION_MAX_AGE_SECONDS,
  sealSession,
  sessionCookieOptions,
  unsealSession,
} from './session';

export type GoogleAuthMode = 'oauth' | 'env_refresh_token' | 'service_account';

export interface GoogleAccess {
  accessToken: string;
  mode: GoogleAuthMode;
  config: GoogleIntegrationConfig;
  /** Set when the session cookie's access token was refreshed and must be re-written. */
  refreshedSession?: GoogleOAuthSession;
  /** Set when the session cookie is unusable and should be cleared. */
  clearSession?: boolean;
}

export class GoogleNotConnectedError extends Error {
  constructor(message = 'Google is not connected. Connect a Google account or configure a service account.') {
    super(message);
    this.name = 'GoogleNotConnectedError';
  }
}

// Cache for the env refresh token flow (shared across requests in this server instance).
let envTokenCache: { accessToken: string; expiresAt: number } | null = null;

const EXPIRY_SKEW_MS = 60_000;

export async function resolveGoogleAccess(req: NextRequest): Promise<GoogleAccess> {
  const config = getGoogleConfig();
  let clearSession = false;

  // 1. Per-visitor OAuth session cookie
  const session = unsealSession(req.cookies.get(GOOGLE_SESSION_COOKIE)?.value, config.tokenSecret);
  if (session) {
    if (session.expiresAt - EXPIRY_SKEW_MS > Date.now()) {
      return { accessToken: session.accessToken, mode: 'oauth', config };
    }
    if (session.refreshToken && isOAuthConfigured(config)) {
      try {
        const token = await refreshAccessToken({
          refreshToken: session.refreshToken,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        });
        const refreshedSession: GoogleOAuthSession = {
          accessToken: token.access_token,
          expiresAt: Date.now() + token.expires_in * 1000,
          // Google normally omits refresh_token on refresh; keep the existing one.
          refreshToken: token.refresh_token || session.refreshToken,
          scope: token.scope || session.scope,
        };
        return { accessToken: refreshedSession.accessToken, mode: 'oauth', config, refreshedSession };
      } catch (error) {
        if (!(error instanceof GoogleApiError)) throw error;
        // invalid_grant etc: the grant was revoked or expired; fall through to other modes.
        clearSession = true;
      }
    } else {
      clearSession = true;
    }
  }

  // 2. Server-wide refresh token
  if (config.envRefreshToken && config.clientId && config.clientSecret) {
    if (!envTokenCache || envTokenCache.expiresAt - EXPIRY_SKEW_MS <= Date.now()) {
      const token = await refreshAccessToken({
        refreshToken: config.envRefreshToken,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });
      envTokenCache = { accessToken: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
    }
    return { accessToken: envTokenCache.accessToken, mode: 'env_refresh_token', config, clearSession };
  }

  // 3. Service account
  if (config.serviceAccount) {
    const accessToken = await getServiceAccountAccessToken(config.serviceAccount, config.scopes);
    return { accessToken, mode: 'service_account', config, clearSession };
  }

  const notConnected = new GoogleNotConnectedError();
  (notConnected as GoogleNotConnectedError & { clearSession?: boolean }).clearSession = clearSession;
  throw notConnected;
}

export function applySessionCookie(res: NextResponse, session: GoogleOAuthSession, secret: string): void {
  res.cookies.set(GOOGLE_SESSION_COOKIE, sealSession(session, secret), sessionCookieOptions(SESSION_MAX_AGE_SECONDS));
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(GOOGLE_SESSION_COOKIE, '', sessionCookieOptions(0));
}

export function googleErrorResponse(error: unknown): NextResponse {
  if (error instanceof GoogleNotConnectedError) {
    const res = NextResponse.json(
      { success: false, message: error.message, code: 'GOOGLE_NOT_CONNECTED' },
      { status: 401 },
    );
    if ((error as GoogleNotConnectedError & { clearSession?: boolean }).clearSession) clearSessionCookie(res);
    return res;
  }
  if (error instanceof GoogleApiError) {
    const status = error.status >= 400 && error.status < 600 ? error.status : 502;
    return NextResponse.json(
      { success: false, message: error.message, code: error.reason || 'GOOGLE_API_ERROR' },
      { status },
    );
  }
  console.error('Google integration error:', error);
  // fetch() network failures surface as TypeError; everything else here is input/config validation.
  if (error instanceof TypeError) {
    return NextResponse.json(
      { success: false, message: 'Could not reach Google APIs. Please try again.', code: 'GOOGLE_NETWORK_ERROR' },
      { status: 502 },
    );
  }
  const message = error instanceof Error ? error.message : 'Unexpected Google integration error.';
  return NextResponse.json({ success: false, message, code: 'GOOGLE_INTEGRATION_ERROR' }, { status: 400 });
}

/**
 * Runs a handler with a resolved access token, returning JSON and persisting any refreshed
 * session cookie.
 */
export function withGoogleAccess(
  req: NextRequest,
  handler: (access: GoogleAccess) => Promise<Record<string, unknown>>,
): Promise<NextResponse> {
  return withPreparedGoogleAccess(req, () => undefined, (access) => handler(access));
}

/**
 * Like withGoogleAccess, but runs a prepare step first that validates input against the env
 * config before any token is requested, so bad input fails fast with a 400.
 */
export async function withPreparedGoogleAccess<P>(
  req: NextRequest,
  prepare: (config: GoogleIntegrationConfig) => P,
  handler: (access: GoogleAccess, prepared: P) => Promise<Record<string, unknown>>,
): Promise<NextResponse> {
  try {
    const prepared = prepare(getGoogleConfig());
    const access = await resolveGoogleAccess(req);
    const data = await handler(access, prepared);
    const res = NextResponse.json({ success: true, authMode: access.mode, ...data });
    if (access.refreshedSession) applySessionCookie(res, access.refreshedSession, access.config.tokenSecret);
    else if (access.clearSession) clearSessionCookie(res);
    return res;
  } catch (error) {
    return googleErrorResponse(error);
  }
}
