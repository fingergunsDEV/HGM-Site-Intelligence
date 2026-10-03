'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Search,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ScanSearch,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { PageMetadata, LogLevel } from '@/types/site-intelligence';

interface GoogleStatus {
  oauthConfigured: boolean;
  oauthConnected: boolean;
  envRefreshTokenConfigured: boolean;
  serviceAccountConfigured: boolean;
  serviceAccountEmail: string | null;
  analyticsGranted: boolean | null;
  searchConsoleGranted: boolean | null;
  defaults: { ga4PropertyId: string | null; gscSiteUrl: string | null };
}

interface Ga4PropertyOption {
  propertyId: string;
  displayName: string;
  accountName: string;
}

interface GscSiteOption {
  siteUrl: string;
  permissionLevel: string;
}

interface GscRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscSitemapRow {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  warnings?: string;
  errors?: string;
}

interface InspectionResult {
  inspectionResultLink?: string;
  indexStatusResult?: {
    verdict?: string;
    coverageState?: string;
    robotsTxtState?: string;
    indexingState?: string;
    lastCrawlTime?: string;
    pageFetchState?: string;
    googleCanonical?: string;
    userCanonical?: string;
  };
}

interface ApiEnvelope {
  success: boolean;
  message?: string;
  code?: string;
  authMode?: string;
}

interface GoogleDataViewProps {
  pages: PageMetadata[];
  onLog?: (level: LogLevel, message: string, url?: string) => void;
}

const GA4_RANGES = [
  { value: '7daysAgo', label: 'Last 7 days' },
  { value: '28daysAgo', label: 'Last 28 days' },
  { value: '90daysAgo', label: 'Last 90 days' },
];

const GSC_DIMENSIONS = ['query', 'page', 'country', 'device', 'date'] as const;

async function callApi<T>(url: string, init?: RequestInit): Promise<T & ApiEnvelope> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))) as T & ApiEnvelope;
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Request failed with HTTP ' + res.status);
  }
  return data;
}

function formatPercent(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? (n * 100).toFixed(1) + '%' : '-';
}

function formatNumber(value: number | string, digits = 0): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: digits }) : '-';
}

const CALLBACK_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: 'Google account connected.' },
  denied: { ok: false, text: 'Google access was denied on the consent screen.' },
  state_mismatch: { ok: false, text: 'OAuth state check failed. Please try connecting again.' },
  not_configured: { ok: false, text: 'Google OAuth is not configured on the server.' },
  error: { ok: false, text: 'Google sign-in failed. Check the server logs and OAuth client settings.' },
};

export function GoogleDataView({ pages, onLog }: GoogleDataViewProps) {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [callbackNotice, setCallbackNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // GA4
  const [ga4Properties, setGa4Properties] = useState<Ga4PropertyOption[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [ga4Range, setGa4Range] = useState('28daysAgo');
  const [ga4Rows, setGa4Rows] = useState<Array<Record<string, string>>>([]);
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Error, setGa4Error] = useState<string | null>(null);

  // Search Console
  const [gscSites, setGscSites] = useState<GscSiteOption[]>([]);
  const [siteUrl, setSiteUrl] = useState('');
  const [gscDays, setGscDays] = useState(28);
  const [gscDimension, setGscDimension] = useState<(typeof GSC_DIMENSIONS)[number]>('query');
  const [gscRows, setGscRows] = useState<GscRow[]>([]);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError] = useState<string | null>(null);
  const [sitemaps, setSitemaps] = useState<GscSitemapRow[] | null>(null);
  const [inspectionUrl, setInspectionUrl] = useState('');
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const log = useCallback((level: LogLevel, message: string, url?: string) => {
    if (onLog) onLog(level, message, url);
  }, [onLog]);

  const loadStatus = useCallback(async () => {
    try {
      const data = await callApi<GoogleStatus>('/api/google/status');
      setStatus(data);
      setStatusError(null);
      setPropertyId((prev) => prev || data.defaults.ga4PropertyId || '');
      setSiteUrl((prev) => prev || data.defaults.gscSiteUrl || '');
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to load Google status');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Read the ?google=... flag set by the OAuth callback, then remove it from the URL.
    Promise.resolve().then(() => {
      if (cancelled || typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      const flag = url.searchParams.get('google');
      if (flag) {
        setCallbackNotice(CALLBACK_MESSAGES[flag] || CALLBACK_MESSAGES.error);
        url.searchParams.delete('google');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
      return loadStatus();
    });
    return () => {
      cancelled = true;
    };
  }, [loadStatus]);

  const isConnected = Boolean(
    status && (status.oauthConnected || status.envRefreshTokenConfigured || status.serviceAccountConfigured),
  );

  const crawledUrls = useMemo(() => Array.from(new Set(pages.map((p) => p.url))).slice(0, 200), [pages]);

  const handleDisconnect = async () => {
    try {
      await callApi('/api/google/disconnect', { method: 'POST' });
      log('INFO', 'Disconnected Google account.');
      setGa4Properties([]);
      setGscSites([]);
      await loadStatus();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const loadGa4Properties = async () => {
    setGa4Error(null);
    try {
      const data = await callApi<{ properties: Ga4PropertyOption[] }>('/api/google/analytics/properties');
      setGa4Properties(data.properties);
      if (!propertyId && data.properties[0]) setPropertyId(data.properties[0].propertyId);
    } catch (err) {
      setGa4Error(err instanceof Error ? err.message : 'Failed to list GA4 properties');
    }
  };

  const runGa4 = async () => {
    setGa4Loading(true);
    setGa4Error(null);
    try {
      const data = await callApi<{ rows: Array<Record<string, string>>; rowCount: number }>(
        '/api/google/analytics/report',
        { method: 'POST', body: JSON.stringify({ propertyId, startDate: ga4Range, endDate: 'yesterday', limit: 50 }) },
      );
      setGa4Rows(data.rows);
      log('SUCCESS', 'GA4 report loaded: ' + data.rows.length + ' of ' + data.rowCount + ' pages (property ' + propertyId + ').');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GA4 report failed';
      setGa4Error(message);
      log('ERROR', 'GA4 report failed: ' + message);
    } finally {
      setGa4Loading(false);
    }
  };

  const loadGscSites = async () => {
    setGscError(null);
    try {
      const data = await callApi<{ sites: GscSiteOption[] }>('/api/google/search-console/sites');
      setGscSites(data.sites);
      if (!siteUrl && data.sites[0]) setSiteUrl(data.sites[0].siteUrl);
    } catch (err) {
      setGscError(err instanceof Error ? err.message : 'Failed to list Search Console sites');
    }
  };

  const runGsc = async () => {
    setGscLoading(true);
    setGscError(null);
    try {
      const data = await callApi<{ rows: GscRow[] }>('/api/google/search-console/search-analytics', {
        method: 'POST',
        body: JSON.stringify({ siteUrl, days: gscDays, dimensions: [gscDimension], rowLimit: 100 }),
      });
      setGscRows(data.rows);
      log('SUCCESS', 'Search Console query returned ' + data.rows.length + ' rows for ' + siteUrl + '.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search Console query failed';
      setGscError(message);
      log('ERROR', 'Search Console query failed: ' + message);
    } finally {
      setGscLoading(false);
    }
  };

  const loadSitemaps = async () => {
    setGscError(null);
    try {
      const data = await callApi<{ sitemaps: GscSitemapRow[] }>(
        '/api/google/search-console/sitemaps?siteUrl=' + encodeURIComponent(siteUrl),
      );
      setSitemaps(data.sitemaps);
    } catch (err) {
      setGscError(err instanceof Error ? err.message : 'Failed to list sitemaps');
    }
  };

  const runInspection = async () => {
    setInspectLoading(true);
    setGscError(null);
    try {
      const data = await callApi<{ inspectionResult: InspectionResult | null }>(
        '/api/google/search-console/url-inspection',
        { method: 'POST', body: JSON.stringify({ siteUrl, inspectionUrl }) },
      );
      setInspection(data.inspectionResult);
      log('INFO', 'URL inspection: ' + (data.inspectionResult?.indexStatusResult?.coverageState || 'no result'), inspectionUrl);
    } catch (err) {
      setGscError(err instanceof Error ? err.message : 'URL inspection failed');
    } finally {
      setInspectLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const buttonClass = 'px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50';
  const ghostButtonClass = 'px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50';

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Google Connection</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void loadStatus()} className={ghostButtonClass}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            {status?.oauthConnected ? (
              <button type="button" onClick={() => void handleDisconnect()} className={ghostButtonClass}>
                <Unlink className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <a
                href="/api/google/oauth/start"
                className={buttonClass + (status && !status.oauthConfigured ? ' pointer-events-none opacity-50' : '')}
                aria-disabled={Boolean(status && !status.oauthConfigured)}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Connect Google</span>
              </a>
            )}
          </div>
        </div>

        {callbackNotice && (
          <div className={'text-xs rounded-lg px-3 py-2 flex items-center gap-2 ' + (callbackNotice.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800')}>
            {callbackNotice.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{callbackNotice.text}</span>
          </div>
        )}
        {statusError && <div className="text-xs rounded-lg px-3 py-2 bg-rose-50 text-rose-800">{statusError}</div>}

        {status && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">OAuth (your Google account)</div>
              <div className="text-slate-500 font-mono mt-0.5">
                {!status.oauthConfigured ? 'Not configured' : status.oauthConnected ? 'Connected' : 'Not connected'}
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">Server refresh token</div>
              <div className="text-slate-500 font-mono mt-0.5">{status.envRefreshTokenConfigured ? 'Configured' : 'Not set'}</div>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900">Service account</div>
              <div className="text-slate-500 font-mono mt-0.5 truncate" title={status.serviceAccountEmail || undefined}>
                {status.serviceAccountEmail || 'Not set'}
              </div>
            </div>
          </div>
        )}
        {status?.oauthConnected && (status.analyticsGranted === false || status.searchConsoleGranted === false) && (
          <div className="text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-800">
            Some permissions were not granted ({status.analyticsGranted === false ? 'Analytics ' : ''}
            {status.searchConsoleGranted === false ? 'Search Console' : ''}). Reconnect and allow both to use every panel.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* GA4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Google Analytics 4: Top Pages</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Data API v1beta</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Property</label>
              {ga4Properties.length > 0 ? (
                <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputClass}>
                  {ga4Properties.map((p) => (
                    <option key={p.propertyId} value={p.propertyId}>
                      {p.displayName + ' (' + p.propertyId + ') - ' + p.accountName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="123456789"
                  className={inputClass}
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Range</label>
              <select value={ga4Range} onChange={(e) => setGa4Range(e.target.value)} className={inputClass}>
                {GA4_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadGa4Properties()} disabled={!isConnected} className={ghostButtonClass}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>List properties</span>
            </button>
            <button type="button" onClick={() => void runGa4()} disabled={!isConnected || !propertyId || ga4Loading} className={buttonClass}>
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{ga4Loading ? 'Running...' : 'Run report'}</span>
            </button>
          </div>

          {ga4Error && <div className="text-xs rounded-lg px-3 py-2 bg-rose-50 text-rose-800">{ga4Error}</div>}

          {ga4Rows.length > 0 && (
            <div className="overflow-x-auto max-h-96 border border-slate-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1.5">Page path</th>
                    <th className="text-right px-2 py-1.5">Views</th>
                    <th className="text-right px-2 py-1.5">Users</th>
                    <th className="text-right px-2 py-1.5">Sessions</th>
                    <th className="text-right px-2 py-1.5">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {ga4Rows.map((row, i) => (
                    <tr key={(row.pagePath || '') + i} className="border-t border-slate-100">
                      <td className="px-2 py-1.5 font-mono truncate max-w-[220px]" title={row.pagePath}>{row.pagePath}</td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(row.screenPageViews)}</td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(row.activeUsers)}</td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(row.sessions)}</td>
                      <td className="px-2 py-1.5 text-right">{formatPercent(row.engagementRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Search Console */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Search className="w-4 h-4 text-indigo-600" />
              <span>Search Console: Performance</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Webmasters v3</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Property</label>
            {gscSites.length > 0 ? (
              <select value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className={inputClass}>
                {gscSites.map((s) => (
                  <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl + ' (' + s.permissionLevel + ')'}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://www.example.com/ or sc-domain:example.com"
                className={inputClass}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Group by</label>
              <select
                value={gscDimension}
                onChange={(e) => setGscDimension(e.target.value as (typeof GSC_DIMENSIONS)[number])}
                className={inputClass}
              >
                {GSC_DIMENSIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Range</label>
              <select value={gscDays} onChange={(e) => setGscDays(Number(e.target.value))} className={inputClass}>
                <option value={7}>Last 7 days</option>
                <option value={28}>Last 28 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadGscSites()} disabled={!isConnected} className={ghostButtonClass}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>List sites</span>
            </button>
            <button type="button" onClick={() => void runGsc()} disabled={!isConnected || !siteUrl || gscLoading} className={buttonClass}>
              <Search className="w-3.5 h-3.5" />
              <span>{gscLoading ? 'Querying...' : 'Run query'}</span>
            </button>
            <button type="button" onClick={() => void loadSitemaps()} disabled={!isConnected || !siteUrl} className={ghostButtonClass}>
              <FileText className="w-3.5 h-3.5" />
              <span>Sitemaps</span>
            </button>
          </div>

          {gscError && <div className="text-xs rounded-lg px-3 py-2 bg-rose-50 text-rose-800">{gscError}</div>}

          {gscRows.length > 0 && (
            <div className="overflow-x-auto max-h-96 border border-slate-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1.5">{gscDimension}</th>
                    <th className="text-right px-2 py-1.5">Clicks</th>
                    <th className="text-right px-2 py-1.5">Impr.</th>
                    <th className="text-right px-2 py-1.5">CTR</th>
                    <th className="text-right px-2 py-1.5">Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {gscRows.map((row, i) => {
                    const key = (row.keys || []).join(' / ');
                    return (
                      <tr key={key + i} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 font-mono truncate max-w-[220px]" title={key}>{key}</td>
                        <td className="px-2 py-1.5 text-right">{formatNumber(row.clicks)}</td>
                        <td className="px-2 py-1.5 text-right">{formatNumber(row.impressions)}</td>
                        <td className="px-2 py-1.5 text-right">{formatPercent(row.ctr)}</td>
                        <td className="px-2 py-1.5 text-right">{formatNumber(row.position, 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {sitemaps && (
            <div className="border border-slate-100 rounded-lg p-3 space-y-1.5">
              <div className="text-xs font-bold text-slate-900">Submitted sitemaps ({sitemaps.length})</div>
              {sitemaps.length === 0 && <div className="text-xs text-slate-500">No sitemaps submitted for this property.</div>}
              {sitemaps.map((s) => (
                <div key={s.path} className="text-[11px] font-mono text-slate-600 flex flex-wrap gap-x-3">
                  <span className="text-slate-900 truncate max-w-full">{s.path}</span>
                  <span>{'downloaded: ' + (s.lastDownloaded || '-')}</span>
                  <span>{'errors: ' + (s.errors || '0') + ', warnings: ' + (s.warnings || '0')}</span>
                  {s.isPending && <span className="text-amber-700">pending</span>}
                </div>
              ))}
            </div>
          )}

          {/* URL Inspection */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <ScanSearch className="w-4 h-4 text-indigo-600" />
              <span>URL Inspection (index status)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                list="google-crawled-urls"
                value={inspectionUrl}
                onChange={(e) => setInspectionUrl(e.target.value)}
                placeholder="https://www.example.com/page"
                className={inputClass}
              />
              <datalist id="google-crawled-urls">
                {crawledUrls.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => void runInspection()}
                disabled={!isConnected || !siteUrl || !inspectionUrl || inspectLoading}
                className={buttonClass}
              >
                <span>{inspectLoading ? 'Inspecting...' : 'Inspect'}</span>
              </button>
            </div>
            {inspection?.indexStatusResult && (
              <div className="text-[11px] font-mono text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                <div>{'Verdict: ' + (inspection.indexStatusResult.verdict || '-')}</div>
                <div>{'Coverage: ' + (inspection.indexStatusResult.coverageState || '-')}</div>
                <div>{'Indexing: ' + (inspection.indexStatusResult.indexingState || '-')}</div>
                <div>{'Robots.txt: ' + (inspection.indexStatusResult.robotsTxtState || '-')}</div>
                <div>{'Fetch: ' + (inspection.indexStatusResult.pageFetchState || '-')}</div>
                <div>{'Last crawl: ' + (inspection.indexStatusResult.lastCrawlTime || '-')}</div>
                <div className="sm:col-span-2 truncate">{'Google canonical: ' + (inspection.indexStatusResult.googleCanonical || '-')}</div>
                {inspection.inspectionResultLink && (
                  <a
                    href={inspection.inspectionResultLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:col-span-2 text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in Search Console</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
