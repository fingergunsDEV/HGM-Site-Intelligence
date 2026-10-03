/**
 * Unit tests for the GA4 / Search Console request builders and env handling.
 * Run with: bun test
 */
import { describe, expect, test } from 'bun:test';
import { createVerify, generateKeyPairSync } from 'node:crypto';
import { normalizePrivateKey, parseServiceAccount, GOOGLE_SCOPES } from './config';
import { buildAuthorizationUrl, buildServiceAccountAssertion, hasScope } from './oauth';
import { buildRunReportUrl, buildTopPagesReportRequest, flattenGa4Report, normalizeGa4PropertyId } from './analytics';
import {
  buildSearchAnalyticsRequest,
  buildSearchAnalyticsUrl,
  buildSitemapsUrl,
  encodeSiteUrl,
  URL_INSPECTION_URL,
} from './search-console';
import { appendQuery, parseGoogleError } from './http';
import { sealSession, unsealSession } from './session';

const BACKSLASH = String.fromCharCode(92);

function makePem(): string {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
}

describe('normalizePrivateKey', () => {
  const pem = makePem();
  const oneLine = pem.trim().split('\n').join(BACKSLASH + 'n');

  test('converts literal backslash-n sequences into real newlines', () => {
    expect(oneLine.includes('\n')).toBe(false);
    const normalized = normalizePrivateKey(oneLine);
    expect(normalized).toBe(pem.trim() + '\n');
    expect(normalized.includes(BACKSLASH)).toBe(false);
  });

  test('strips wrapping quotes left by .env tooling', () => {
    expect(normalizePrivateKey('"' + oneLine + '"')).toBe(pem.trim() + '\n');
    expect(normalizePrivateKey("'" + oneLine + "'")).toBe(pem.trim() + '\n');
  });

  test('leaves keys with real newlines unchanged and handles CRLF', () => {
    expect(normalizePrivateKey(pem)).toBe(pem.trim() + '\n');
    expect(normalizePrivateKey(pem.split('\n').join('\r\n'))).toBe(pem.trim() + '\n');
  });

  test('returns an empty string for missing values', () => {
    expect(normalizePrivateKey(undefined)).toBe('');
    expect(normalizePrivateKey('')).toBe('');
  });
});

describe('parseServiceAccount', () => {
  const pem = makePem();

  test('parses a JSON key file and yields a signable key', () => {
    const keyJson = JSON.stringify({ client_email: 'sa@test.iam.gserviceaccount.com', private_key: pem, private_key_id: 'kid1' });
    const creds = parseServiceAccount({ keyJson });
    expect(creds?.clientEmail).toBe('sa@test.iam.gserviceaccount.com');
    expect(creds?.privateKey).toBe(pem.trim() + '\n');
    expect(creds?.privateKeyId).toBe('kid1');
  });

  test('handles double-escaped newlines inside the JSON value', () => {
    // JSON text containing two backslashes + n decodes to a literal backslash-n.
    const doubleEscaped = pem.trim().split('\n').join(BACKSLASH + 'n');
    const keyJson = JSON.stringify({ client_email: 'sa@test', private_key: doubleEscaped });
    expect(parseServiceAccount({ keyJson })?.privateKey).toBe(pem.trim() + '\n');
  });

  test('throws a readable error for invalid JSON', () => {
    expect(() => parseServiceAccount({ keyJson: '{not json' })).toThrow(/not valid JSON/);
  });

  test('supports email + private key env vars', () => {
    const creds = parseServiceAccount({ clientEmail: 'sa@test', privateKey: pem.trim().split('\n').join(BACKSLASH + 'n') });
    expect(creds?.privateKey).toBe(pem.trim() + '\n');
  });

  test('returns null when nothing is configured', () => {
    expect(parseServiceAccount({})).toBeNull();
  });
});

describe('OAuth helpers', () => {
  test('builds the documented authorization URL with percent-encoded scopes', () => {
    const url = new URL(buildAuthorizationUrl({
      clientId: 'client-123.apps.googleusercontent.com',
      redirectUri: 'https://app.example.com/api/google/oauth/callback',
      scopes: [GOOGLE_SCOPES.analyticsReadonly, GOOGLE_SCOPES.webmastersReadonly],
      state: 'abc',
    }));
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('include_granted_scopes')).toBe('true');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('state')).toBe('abc');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.com/api/google/oauth/callback');
    expect(url.searchParams.get('scope')).toBe(
      'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',
    );
    expect(url.search.includes('%20')).toBe(true);
    expect(url.search.includes('+')).toBe(false);
  });

  test('hasScope matches whole space-delimited entries only', () => {
    const granted = GOOGLE_SCOPES.analyticsReadonly + ' openid';
    expect(hasScope(granted, GOOGLE_SCOPES.analyticsReadonly)).toBe(true);
    expect(hasScope(granted, GOOGLE_SCOPES.webmastersReadonly)).toBe(false);
    expect(hasScope(undefined, GOOGLE_SCOPES.analyticsReadonly)).toBe(false);
  });

  test('service account assertion is a valid RS256 JWT with the documented claims', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const oneLine = pem.trim().split('\n').join(BACKSLASH + 'n');
    const creds = parseServiceAccount({ clientEmail: 'sa@test.iam.gserviceaccount.com', privateKey: oneLine });
    if (!creds) throw new Error('expected credentials');

    const jwt = buildServiceAccountAssertion(creds, [GOOGLE_SCOPES.analyticsReadonly], 1700000000);
    const [h, c, sig] = jwt.split('.');
    const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
    const claims = JSON.parse(Buffer.from(c, 'base64url').toString('utf8'));
    expect(header).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(claims).toEqual({
      iss: 'sa@test.iam.gserviceaccount.com',
      scope: GOOGLE_SCOPES.analyticsReadonly,
      aud: 'https://oauth2.googleapis.com/token',
      iat: 1700000000,
      exp: 1700003600,
    });
    expect(jwt.includes('=')).toBe(false);

    const verifier = createVerify('RSA-SHA256');
    verifier.update(h + '.' + c);
    expect(verifier.verify(publicKey, Buffer.from(sig, 'base64url'))).toBe(true);
  });
});

describe('GA4 Data API', () => {
  test('normalizes property ids', () => {
    expect(normalizeGa4PropertyId('123456789')).toBe('123456789');
    expect(normalizeGa4PropertyId('properties/123456789')).toBe('123456789');
    expect(normalizeGa4PropertyId(987)).toBe('987');
    expect(() => normalizeGa4PropertyId('G-ABC123')).toThrow();
    expect(() => normalizeGa4PropertyId('')).toThrow();
    expect(() => normalizeGa4PropertyId('123/../456')).toThrow();
  });

  test('builds the runReport URL', () => {
    expect(buildRunReportUrl('properties/42')).toBe('https://analyticsdata.googleapis.com/v1beta/properties/42:runReport');
  });

  test('builds a valid default report body', () => {
    const body = buildTopPagesReportRequest({ startDate: '7daysAgo' });
    expect(body.dateRanges).toEqual([{ startDate: '7daysAgo', endDate: 'yesterday' }]);
    expect(body.dimensions).toEqual([{ name: 'pagePath' }]);
    expect(body.metrics?.map((m) => m.name)).toEqual(['screenPageViews', 'activeUsers', 'sessions', 'engagementRate']);
    expect(body.orderBys).toEqual([{ metric: { metricName: 'screenPageViews' }, desc: true }]);
    expect(() => buildTopPagesReportRequest({ startDate: 'last week' })).toThrow();
    // Round-trips through JSON without any escaping surprises.
    expect(JSON.parse(JSON.stringify(body))).toEqual(body);
  });

  test('flattens report rows by header name', () => {
    const rows = flattenGa4Report({
      dimensionHeaders: [{ name: 'pagePath' }],
      metricHeaders: [{ name: 'screenPageViews', type: 'TYPE_INTEGER' }],
      rows: [{ dimensionValues: [{ value: '/' }], metricValues: [{ value: '10' }] }],
    });
    expect(rows).toEqual([{ pagePath: '/', screenPageViews: '10' }]);
  });
});

describe('Search Console API', () => {
  test('percent-encodes URL-prefix and domain properties in the path', () => {
    expect(encodeSiteUrl('https://www.example.com/')).toBe('https%3A%2F%2Fwww.example.com%2F');
    expect(encodeSiteUrl('sc-domain:example.com')).toBe('sc-domain%3Aexample.com');
    expect(buildSearchAnalyticsUrl('https://www.example.com/')).toBe(
      'https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.example.com%2F/searchAnalytics/query',
    );
    expect(buildSitemapsUrl('sc-domain:example.com')).toBe(
      'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/sitemaps',
    );
    expect(URL_INSPECTION_URL).toBe('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect');
  });

  test('rejects invalid properties', () => {
    expect(() => encodeSiteUrl('example.com')).toThrow();
    expect(() => encodeSiteUrl('')).toThrow();
  });

  test('builds a searchAnalytics.query body with PT dates', () => {
    const now = new Date('2026-10-02T12:00:00Z');
    const body = buildSearchAnalyticsRequest({ days: 28, dimensions: ['page'], rowLimit: 50000, now });
    expect(body).toEqual({
      startDate: '2026-09-04',
      endDate: '2026-10-01',
      dimensions: ['page'],
      rowLimit: 25000,
    });
    expect(() => buildSearchAnalyticsRequest({ startDate: '2026-10-05', endDate: '2026-10-01' })).toThrow();
    expect(() => buildSearchAnalyticsRequest({ startDate: '10/01/2026', endDate: '2026-10-01' })).toThrow();
  });
});

describe('http helpers', () => {
  test('appendQuery skips empty values and encodes the rest', () => {
    expect(appendQuery('https://x.test/a', { pageSize: 200, pageToken: undefined, q: 'a b&c' })).toBe(
      'https://x.test/a?pageSize=200&q=a+b%26c',
    );
    expect(appendQuery('https://x.test/a', {})).toBe('https://x.test/a');
  });

  test('parses API and OAuth error envelopes', () => {
    const apiErr = parseGoogleError(403, { error: { code: 403, message: 'User does not have sufficient permissions', status: 'PERMISSION_DENIED' } });
    expect(apiErr.status).toBe(403);
    expect(apiErr.reason).toBe('PERMISSION_DENIED');
    expect(apiErr.message).toBe('User does not have sufficient permissions');
    const oauthErr = parseGoogleError(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' });
    expect(oauthErr.reason).toBe('invalid_grant');
    expect(oauthErr.message).toBe('Token has been expired or revoked.');
  });
});

describe('session cookie sealing', () => {
  test('round-trips and rejects tampering or the wrong secret', () => {
    const session = { accessToken: 'ya29.test', expiresAt: 123, refreshToken: '1//r', scope: 'a b' };
    const sealed = sealSession(session, 'secret-one');
    expect(unsealSession(sealed, 'secret-one')).toEqual(session);
    expect(unsealSession(sealed, 'secret-two')).toBeNull();
    const parts = sealed.split('.');
    const flipped = parts[2].charAt(0) === 'A' ? 'B' : 'A';
    const tampered = [parts[0], parts[1], flipped + parts[2].slice(1)].join('.');
    expect(unsealSession(tampered, 'secret-one')).toBeNull();
    expect(unsealSession(undefined, 'secret-one')).toBeNull();
  });
});
