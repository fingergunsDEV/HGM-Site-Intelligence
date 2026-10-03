/**
 * Google Search Console clients.
 *  - sites.list:              GET  https://www.googleapis.com/webmasters/v3/sites
 *  - searchanalytics.query:   POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
 *  - sitemaps.list:           GET  https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps
 *  - urlInspection.index.inspect:
 *                             POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect
 * All accept the https://www.googleapis.com/auth/webmasters.readonly scope.
 */
import { GOOGLE_ENDPOINTS } from './config';
import { googleFetch } from './http';

export type GscDimension = 'country' | 'device' | 'page' | 'query' | 'searchAppearance' | 'date' | 'hour';
export type GscSearchType = 'discover' | 'googleNews' | 'news' | 'image' | 'video' | 'web';
export type GscFilterOperator = 'contains' | 'equals' | 'notContains' | 'notEquals' | 'includingRegex' | 'excludingRegex';

export interface GscDimensionFilter {
  dimension: Exclude<GscDimension, 'date' | 'hour'>;
  operator?: GscFilterOperator;
  expression: string;
}

export interface GscSearchAnalyticsRequest {
  startDate: string;
  endDate: string;
  dimensions?: GscDimension[];
  type?: GscSearchType;
  dimensionFilterGroups?: Array<{ groupType?: 'and'; filters: GscDimensionFilter[] }>;
  aggregationType?: 'auto' | 'byPage' | 'byProperty' | 'byNewsShowcasePanel';
  rowLimit?: number;
  startRow?: number;
  dataState?: 'final' | 'all' | 'hourly_all';
}

export interface GscSearchAnalyticsRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSearchAnalyticsResponse {
  rows?: GscSearchAnalyticsRow[];
  responseAggregationType?: string;
  metadata?: Record<string, unknown>;
}

export interface GscSiteEntry {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscSitesResponse {
  siteEntry?: GscSiteEntry[];
}

export interface GscSitemap {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: string;
  errors?: string;
  contents?: Array<{ type: string; submitted?: string; indexed?: string }>;
}

export interface GscSitemapsResponse {
  sitemap?: GscSitemap[];
}

export interface GscUrlInspectionRequest {
  inspectionUrl: string;
  siteUrl: string;
  languageCode?: string;
}

export interface GscUrlInspectionResponse {
  inspectionResult?: {
    inspectionResultLink?: string;
    indexStatusResult?: Record<string, unknown>;
    mobileUsabilityResult?: Record<string, unknown>;
    richResultsResult?: Record<string, unknown>;
    ampResult?: Record<string, unknown>;
  };
}

/**
 * Validates a Search Console property identifier.
 * URL-prefix properties look like "https://www.example.com/" and domain properties
 * look like "sc-domain:example.com".
 */
export function assertValidSiteUrl(siteUrl: string): string {
  const value = (siteUrl || '').trim();
  if (/^sc-domain:[^\s/]+$/i.test(value) || /^https?:\/\/[^\s]+$/i.test(value)) return value;
  throw new Error('Invalid Search Console property. Use "https://www.example.com/" or "sc-domain:example.com".');
}

/** The siteUrl path segment must be fully percent-encoded (":" and "/" included). */
export function encodeSiteUrl(siteUrl: string): string {
  return encodeURIComponent(assertValidSiteUrl(siteUrl));
}

export function buildSearchAnalyticsUrl(siteUrl: string): string {
  return GOOGLE_ENDPOINTS.webmasters + '/sites/' + encodeSiteUrl(siteUrl) + '/searchAnalytics/query';
}

export function buildSitemapsUrl(siteUrl: string): string {
  return GOOGLE_ENDPOINTS.webmasters + '/sites/' + encodeSiteUrl(siteUrl) + '/sitemaps';
}

export const URL_INSPECTION_URL = GOOGLE_ENDPOINTS.searchConsole + '/urlInspection/index:inspect';

const GSC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Formats a Date as YYYY-MM-DD in America/Los_Angeles (Search Console reports in PT). */
export function formatPacificDate(date: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function buildSearchAnalyticsRequest(options: {
  startDate?: string;
  endDate?: string;
  days?: number;
  dimensions?: GscDimension[];
  rowLimit?: number;
  type?: GscSearchType;
  now?: Date;
} = {}): GscSearchAnalyticsRequest {
  const now = options.now || new Date();
  const days = Math.min(Math.max(options.days ?? 28, 1), 480);
  const dayMs = 24 * 60 * 60 * 1000;
  const endDate = options.endDate || formatPacificDate(new Date(now.getTime() - dayMs));
  const startDate = options.startDate || formatPacificDate(new Date(now.getTime() - days * dayMs));
  if (!GSC_DATE_PATTERN.test(startDate) || !GSC_DATE_PATTERN.test(endDate)) {
    throw new Error('Search Console dates must be in YYYY-MM-DD format.');
  }
  if (startDate > endDate) throw new Error('startDate must be on or before endDate.');

  const request: GscSearchAnalyticsRequest = {
    startDate,
    endDate,
    dimensions: options.dimensions && options.dimensions.length > 0 ? options.dimensions : ['query'],
    rowLimit: Math.min(Math.max(options.rowLimit ?? 100, 1), 25000),
  };
  if (options.type) request.type = options.type;
  return request;
}

export function listGscSites(accessToken: string): Promise<GscSitesResponse> {
  return googleFetch<GscSitesResponse>(GOOGLE_ENDPOINTS.webmasters + '/sites', { method: 'GET', accessToken });
}

export function queryGscSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  request: GscSearchAnalyticsRequest,
): Promise<GscSearchAnalyticsResponse> {
  return googleFetch<GscSearchAnalyticsResponse>(buildSearchAnalyticsUrl(siteUrl), {
    method: 'POST',
    accessToken,
    body: request,
  });
}

export function listGscSitemaps(
  accessToken: string,
  siteUrl: string,
  sitemapIndex?: string,
): Promise<GscSitemapsResponse> {
  return googleFetch<GscSitemapsResponse>(buildSitemapsUrl(siteUrl), {
    method: 'GET',
    accessToken,
    query: { sitemapIndex },
  });
}

export function inspectGscUrl(
  accessToken: string,
  request: GscUrlInspectionRequest,
): Promise<GscUrlInspectionResponse> {
  const body: GscUrlInspectionRequest = {
    inspectionUrl: request.inspectionUrl,
    siteUrl: assertValidSiteUrl(request.siteUrl),
  };
  if (request.languageCode) body.languageCode = request.languageCode;
  return googleFetch<GscUrlInspectionResponse>(URL_INSPECTION_URL, { method: 'POST', accessToken, body });
}
