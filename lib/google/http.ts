/**
 * Minimal fetch wrapper for Google REST APIs (server-side only).
 */

export class GoogleApiError extends Error {
  status: number;
  reason?: string;
  details?: unknown;

  constructor(message: string, status: number, reason?: string, details?: unknown) {
    super(message);
    this.name = 'GoogleApiError';
    this.status = status;
    this.reason = reason;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | undefined | null;

export interface GoogleRequestOptions {
  method?: 'GET' | 'POST';
  accessToken: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
}

export function appendQuery(url: string, query?: Record<string, QueryValue>): string {
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  if (!qs) return url;
  return url + (url.includes('?') ? '&' : '?') + qs;
}

/** Extracts a readable message from Google's standard JSON error envelope. */
export function parseGoogleError(status: number, payload: unknown): GoogleApiError {
  const fallback = 'Google API request failed with HTTP ' + status;
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    // Standard API error: { error: { code, message, status, errors: [{ reason }] } }
    if (p.error && typeof p.error === 'object') {
      const err = p.error as Record<string, unknown>;
      const errors = Array.isArray(err.errors) ? (err.errors as Array<Record<string, unknown>>) : [];
      const reason = (typeof err.status === 'string' ? err.status : undefined)
        || (typeof errors[0]?.reason === 'string' ? (errors[0].reason as string) : undefined);
      const message = typeof err.message === 'string' ? err.message : fallback;
      return new GoogleApiError(message, status, reason, payload);
    }
    // OAuth token endpoint error: { error: 'invalid_grant', error_description: '...' }
    if (typeof p.error === 'string') {
      const description = typeof p.error_description === 'string' ? p.error_description : p.error;
      return new GoogleApiError(description, status, p.error, payload);
    }
  }
  return new GoogleApiError(fallback, status, undefined, payload);
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function googleFetch<T>(url: string, options: GoogleRequestOptions): Promise<T> {
  const method = options.method || (options.body !== undefined ? 'POST' : 'GET');
  const headers: Record<string, string> = {
    Authorization: 'Bearer ' + options.accessToken,
    Accept: 'application/json',
  };
  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const res = await fetch(appendQuery(url, options.query), {
    method,
    headers,
    body,
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) throw parseGoogleError(res.status, payload);
  return payload as T;
}

/** POSTs an application/x-www-form-urlencoded body (used by the OAuth token endpoints). */
export async function postForm<T>(url: string, form: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(form).toString(),
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) throw parseGoogleError(res.status, payload);
  return payload as T;
}
