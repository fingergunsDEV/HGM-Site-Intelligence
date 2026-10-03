/**
 * Google OAuth 2.0 helpers implemented directly against the documented REST endpoints.
 *  - Web server flow: https://developers.google.com/identity/protocols/oauth2/web-server
 *  - Service account JWT flow: https://developers.google.com/identity/protocols/oauth2/service-account
 *
 * Server-side only (uses node:crypto).
 */
import { createSign, randomBytes } from 'node:crypto';
import { GOOGLE_ENDPOINTS, ServiceAccountCredentials } from './config';
import { postForm } from './http';

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  id_token?: string;
}

export interface AuthorizationUrlParams {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  loginHint?: string;
  /** Forces the consent screen so Google re-issues a refresh token. Defaults to true. */
  forceConsent?: boolean;
}

export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Builds the Google authorization URL. Parameters are encoded with encodeURIComponent so the
 * space-delimited scope list becomes %20 (matching Google's documented examples).
 */
export function buildAuthorizationUrl(params: AuthorizationUrlParams): string {
  const query: Array<[string, string]> = [
    ['client_id', params.clientId],
    ['redirect_uri', params.redirectUri],
    ['response_type', 'code'],
    ['scope', params.scopes.join(' ')],
    ['access_type', 'offline'],
    ['include_granted_scopes', 'true'],
    ['state', params.state],
  ];
  if (params.forceConsent !== false) query.push(['prompt', 'consent']);
  if (params.loginHint) query.push(['login_hint', params.loginHint]);

  const qs = query
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value))
    .join('&');
  return GOOGLE_ENDPOINTS.authorize + '?' + qs;
}

export function exchangeCodeForTokens(args: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  return postForm<GoogleTokenResponse>(GOOGLE_ENDPOINTS.token, {
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
    grant_type: 'authorization_code',
  });
}

export function refreshAccessToken(args: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<GoogleTokenResponse> {
  return postForm<GoogleTokenResponse>(GOOGLE_ENDPOINTS.token, {
    client_id: args.clientId,
    client_secret: args.clientSecret,
    refresh_token: args.refreshToken,
    grant_type: 'refresh_token',
  });
}

export async function revokeToken(token: string): Promise<void> {
  await postForm<Record<string, unknown>>(GOOGLE_ENDPOINTS.revoke, { token });
}

/** Granted scopes come back as a space-delimited string. */
export function hasScope(grantedScopes: string | undefined, scope: string): boolean {
  if (!grantedScopes) return false;
  return grantedScopes.split(' ').includes(scope);
}

// ---------------------------------------------------------------------------
// Service account (two-legged OAuth) via a self-signed RS256 JWT assertion
// ---------------------------------------------------------------------------

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

export function buildServiceAccountAssertion(
  creds: ServiceAccountCredentials,
  scopes: string[],
  nowSeconds: number = Math.floor(Date.now() / 1000),
  subject?: string,
): string {
  const header: Record<string, string> = { alg: 'RS256', typ: 'JWT' };
  if (creds.privateKeyId) header.kid = creds.privateKeyId;

  const claims: Record<string, string | number> = {
    iss: creds.clientEmail,
    scope: scopes.join(' '),
    aud: GOOGLE_ENDPOINTS.token,
    iat: nowSeconds,
    // Google allows at most one hour between iat and exp.
    exp: nowSeconds + 3600,
  };
  if (subject) claims.sub = subject;

  const signingInput = base64UrlJson(header) + '.' + base64UrlJson(claims);
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput, 'utf8');
  signer.end();
  const signature = signer.sign(creds.privateKey).toString('base64url');
  return signingInput + '.' + signature;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const serviceAccountTokenCache = new Map<string, CachedToken>();

export async function getServiceAccountAccessToken(
  creds: ServiceAccountCredentials,
  scopes: string[],
): Promise<string> {
  const cacheKey = creds.clientEmail + '|' + scopes.join(' ');
  const cached = serviceAccountTokenCache.get(cacheKey);
  // Refresh one minute before expiry to avoid edge-of-expiry failures.
  if (cached && cached.expiresAt - 60_000 > Date.now()) return cached.accessToken;

  const assertion = buildServiceAccountAssertion(creds, scopes);
  const token = await postForm<GoogleTokenResponse>(GOOGLE_ENDPOINTS.token, {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  serviceAccountTokenCache.set(cacheKey, {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  });
  return token.access_token;
}
