/**
 * Encrypted, httpOnly cookie storage for the user's Google OAuth tokens.
 * The app has no database, so tokens live in an AES-256-GCM sealed cookie that
 * only the server can read. Server-side only.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const GOOGLE_SESSION_COOKIE = 'hgm_google_oauth';
export const GOOGLE_STATE_COOKIE = 'hgm_google_oauth_state';

export interface GoogleOAuthSession {
  accessToken: string;
  /** Epoch milliseconds when the access token expires. */
  expiresAt: number;
  refreshToken?: string;
  scope?: string;
}

function deriveKey(secret: string): Buffer {
  if (!secret) throw new Error('GOOGLE_TOKEN_SECRET (or GOOGLE_CLIENT_SECRET) must be set to store Google tokens.');
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function sealSession(session: GoogleOAuthSession, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.');
}

export function unsealSession(value: string | undefined, secret: string): GoogleOAuthSession | null {
  if (!value || !secret) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(plaintext) as GoogleOAuthSession;
    if (!parsed || typeof parsed.accessToken !== 'string') return null;
    return parsed;
  } catch {
    // Tampered, rotated secret, or malformed cookie: treat as signed out.
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** 180 days; Google may expire unused refresh tokens sooner. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
/** OAuth state cookie only needs to survive the consent round trip. */
export const STATE_MAX_AGE_SECONDS = 60 * 10;
