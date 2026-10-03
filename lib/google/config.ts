/**
 * Google Analytics 4 + Google Search Console integration: shared constants and env config.
 *
 * Endpoints and scopes are taken from the official Google documentation:
 *  - OAuth 2.0 web server flow: https://developers.google.com/identity/protocols/oauth2/web-server
 *  - Service accounts (JWT bearer): https://developers.google.com/identity/protocols/oauth2/service-account
 *  - GA4 Data API runReport: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
 *  - GA4 Admin API accountSummaries.list: https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/accountSummaries/list
 *  - Search Console API (webmasters v3): https://developers.google.com/webmaster-tools/v1/api_reference_index
 *  - URL Inspection API: https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
 *
 * Server-side only. Never import this file from a 'use client' component.
 */

export const GOOGLE_SCOPES = {
  analyticsReadonly: 'https://www.googleapis.com/auth/analytics.readonly',
  webmastersReadonly: 'https://www.googleapis.com/auth/webmasters.readonly',
} as const;

export const DEFAULT_GOOGLE_SCOPES: string[] = [
  GOOGLE_SCOPES.analyticsReadonly,
  GOOGLE_SCOPES.webmastersReadonly,
];

export const GOOGLE_ENDPOINTS = {
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  revoke: 'https://oauth2.googleapis.com/revoke',
  analyticsData: 'https://analyticsdata.googleapis.com/v1beta',
  analyticsAdmin: 'https://analyticsadmin.googleapis.com/v1beta',
  webmasters: 'https://www.googleapis.com/webmasters/v3',
  searchConsole: 'https://searchconsole.googleapis.com/v1',
} as const;

export const OAUTH_CALLBACK_PATH = '/api/google/oauth/callback';

/**
 * Normalizes a PEM private key loaded from an environment variable.
 *
 * Hosting dashboards and .env files commonly store the key on one line with the
 * two-character sequence backslash + "n" instead of real line breaks, and some
 * wrap the whole value in quotes. Both break RSA signing, so:
 *  - trim whitespace and strip one pair of wrapping single or double quotes
 *  - convert literal backslash-n sequences into real newlines
 *  - normalize CRLF line endings to LF
 * Keys that already contain real newlines pass through unchanged.
 */
export function normalizePrivateKey(raw: string | undefined | null): string {
  if (!raw) return '';
  let key = raw.trim();
  const first = key.charAt(0);
  const last = key.charAt(key.length - 1);
  if (key.length >= 2 && (first === '"' || first === "'") && first === last) {
    key = key.slice(1, -1);
  }
  // The regex matches a literal backslash followed by "n" (intentional escape).
  key = key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  return key.trim() + '\n';
}

export interface ServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
  privateKeyId?: string;
}

export interface GoogleIntegrationConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  ga4PropertyId: string;
  gscSiteUrl: string;
  /** Optional long-lived refresh token for a server-wide OAuth connection. */
  envRefreshToken: string;
  /** Secret used to encrypt the OAuth token cookie. Falls back to the client secret. */
  tokenSecret: string;
  serviceAccount: ServiceAccountCredentials | null;
}

function readEnv(name: string): string {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Parses service account credentials from either:
 *  - GOOGLE_SERVICE_ACCOUNT_KEY_JSON (the full JSON key file contents), or
 *  - GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY
 */
export function parseServiceAccount(env: {
  keyJson?: string;
  clientEmail?: string;
  privateKey?: string;
}): ServiceAccountCredentials | null {
  if (env.keyJson) {
    let parsed: { client_email?: unknown; private_key?: unknown; private_key_id?: unknown };
    try {
      parsed = JSON.parse(env.keyJson);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_JSON is not valid JSON. Paste the key file contents as-is (no extra escaping).');
    }
    const clientEmail = typeof parsed.client_email === 'string' ? parsed.client_email : '';
    const privateKey = typeof parsed.private_key === 'string' ? parsed.private_key : '';
    if (!clientEmail || !privateKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_JSON must contain client_email and private_key.');
    }
    return {
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
      privateKeyId: typeof parsed.private_key_id === 'string' ? parsed.private_key_id : undefined,
    };
  }
  if (env.clientEmail && env.privateKey) {
    return { clientEmail: env.clientEmail, privateKey: normalizePrivateKey(env.privateKey) };
  }
  return null;
}

export function getGoogleConfig(): GoogleIntegrationConfig {
  const appUrl = readEnv('APP_URL');
  const explicitRedirect = readEnv('GOOGLE_REDIRECT_URI');
  const redirectUri = explicitRedirect
    || (isHttpUrl(appUrl) ? appUrl.replace(/\/+$/, '') + OAUTH_CALLBACK_PATH : '');

  const clientSecret = readEnv('GOOGLE_CLIENT_SECRET');

  return {
    clientId: readEnv('GOOGLE_CLIENT_ID'),
    clientSecret,
    redirectUri,
    scopes: DEFAULT_GOOGLE_SCOPES,
    ga4PropertyId: readEnv('GA4_PROPERTY_ID'),
    gscSiteUrl: readEnv('GSC_SITE_URL'),
    envRefreshToken: readEnv('GOOGLE_REFRESH_TOKEN'),
    tokenSecret: readEnv('GOOGLE_TOKEN_SECRET') || clientSecret,
    serviceAccount: parseServiceAccount({
      keyJson: readEnv('GOOGLE_SERVICE_ACCOUNT_KEY_JSON'),
      clientEmail: readEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      // Not trimmed by readEnv semantics beyond whitespace; normalizePrivateKey handles the rest.
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    }),
  };
}

export function isOAuthConfigured(config: GoogleIntegrationConfig): boolean {
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}
