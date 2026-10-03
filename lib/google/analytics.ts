/**
 * Google Analytics 4 clients.
 *  - Data API v1beta properties.runReport:
 *    POST https://analyticsdata.googleapis.com/v1beta/{property=properties/*}:runReport
 *  - Admin API v1beta accountSummaries.list:
 *    GET https://analyticsadmin.googleapis.com/v1beta/accountSummaries
 * Both accept the https://www.googleapis.com/auth/analytics.readonly scope.
 */
import { GOOGLE_ENDPOINTS } from './config';
import { googleFetch } from './http';

// ---- Request types (subset of the documented RunReportRequest) ----

export interface Ga4Dimension { name: string }
export interface Ga4Metric { name: string; expression?: string; invisible?: boolean }
export interface Ga4DateRange { startDate: string; endDate: string; name?: string }

export interface Ga4OrderBy {
  desc?: boolean;
  metric?: { metricName: string };
  dimension?: {
    dimensionName: string;
    orderType?: 'ORDER_TYPE_UNSPECIFIED' | 'ALPHANUMERIC' | 'CASE_INSENSITIVE_ALPHANUMERIC' | 'NUMERIC';
  };
}

export interface Ga4RunReportRequest {
  dimensions?: Ga4Dimension[];
  metrics?: Ga4Metric[];
  dateRanges?: Ga4DateRange[];
  dimensionFilter?: Record<string, unknown>;
  metricFilter?: Record<string, unknown>;
  /** int64 values are serialized as strings or numbers; both are accepted. */
  offset?: string | number;
  limit?: string | number;
  metricAggregations?: Array<'TOTAL' | 'MAXIMUM' | 'MINIMUM' | 'COUNT'>;
  orderBys?: Ga4OrderBy[];
  currencyCode?: string;
  keepEmptyRows?: boolean;
  returnPropertyQuota?: boolean;
}

// ---- Response types (subset of RunReportResponse) ----

export interface Ga4Row {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

export interface Ga4RunReportResponse {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type?: string }>;
  rows?: Ga4Row[];
  totals?: Ga4Row[];
  rowCount?: number;
  metadata?: Record<string, unknown>;
  propertyQuota?: Record<string, unknown>;
  kind?: string;
}

export interface Ga4PropertySummary {
  property: string;
  displayName: string;
  propertyType?: string;
  parent?: string;
}

export interface Ga4AccountSummary {
  name: string;
  account: string;
  displayName: string;
  propertySummaries?: Ga4PropertySummary[];
}

export interface Ga4AccountSummariesResponse {
  accountSummaries?: Ga4AccountSummary[];
  nextPageToken?: string;
}

/**
 * Accepts "123456789" or "properties/123456789" and returns the numeric id.
 * Throws for anything else so we never build a malformed resource path.
 */
export function normalizeGa4PropertyId(input: string | number | undefined | null): string {
  const raw = String(input ?? '').trim().replace(/^properties\//, '');
  if (!/^\d+$/.test(raw)) {
    throw new Error('Invalid GA4 property id. Use the numeric property id, e.g. 123456789 (not a G- measurement id).');
  }
  return raw;
}

export function buildRunReportUrl(propertyId: string | number): string {
  return GOOGLE_ENDPOINTS.analyticsData + '/properties/' + normalizeGa4PropertyId(propertyId) + ':runReport';
}

// GA4 accepts YYYY-MM-DD, "today", "yesterday" or "NdaysAgo".
const GA4_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2}|today|yesterday|\d+daysAgo)$/;

export function isValidGa4Date(value: string): boolean {
  return GA4_DATE_PATTERN.test(value);
}

/** Default "top landing pages" report used by the dashboard. */
export function buildTopPagesReportRequest(options: {
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}): Ga4RunReportRequest {
  const startDate = options.startDate || '28daysAgo';
  const endDate = options.endDate || 'yesterday';
  if (!isValidGa4Date(startDate) || !isValidGa4Date(endDate)) {
    throw new Error('GA4 dates must be YYYY-MM-DD, today, yesterday, or NdaysAgo.');
  }
  return {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'engagementRate' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: Math.min(Math.max(options.limit ?? 50, 1), 250000),
  };
}

export function runGa4Report(
  accessToken: string,
  propertyId: string | number,
  request: Ga4RunReportRequest,
): Promise<Ga4RunReportResponse> {
  return googleFetch<Ga4RunReportResponse>(buildRunReportUrl(propertyId), {
    method: 'POST',
    accessToken,
    body: request,
  });
}

export function listGa4AccountSummaries(
  accessToken: string,
  options: { pageSize?: number; pageToken?: string } = {},
): Promise<Ga4AccountSummariesResponse> {
  return googleFetch<Ga4AccountSummariesResponse>(GOOGLE_ENDPOINTS.analyticsAdmin + '/accountSummaries', {
    method: 'GET',
    accessToken,
    query: { pageSize: options.pageSize, pageToken: options.pageToken },
  });
}

/** Flattens a runReport response into plain row objects keyed by header name. */
export function flattenGa4Report(response: Ga4RunReportResponse): Array<Record<string, string>> {
  const dimensionNames = (response.dimensionHeaders || []).map((h) => h.name);
  const metricNames = (response.metricHeaders || []).map((h) => h.name);
  return (response.rows || []).map((row) => {
    const record: Record<string, string> = {};
    dimensionNames.forEach((name, i) => {
      record[name] = row.dimensionValues?.[i]?.value ?? '';
    });
    metricNames.forEach((name, i) => {
      record[name] = row.metricValues?.[i]?.value ?? '';
    });
    return record;
  });
}
