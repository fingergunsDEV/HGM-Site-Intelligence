import { NextRequest } from 'next/server';
import { withPreparedGoogleAccess } from '@/lib/google/auth';
import {
  GscDimension,
  GscSearchAnalyticsRequest,
  GscSearchType,
  assertValidSiteUrl,
  buildSearchAnalyticsRequest,
  queryGscSearchAnalytics,
} from '@/lib/google/search-console';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SearchAnalyticsBody {
  siteUrl?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  dimensions?: GscDimension[];
  rowLimit?: number;
  type?: GscSearchType;
  /** Optional full searchAnalytics.query body; overrides the convenience fields. */
  request?: GscSearchAnalyticsRequest;
}

// POST /api/google/search-console/search-analytics -> searchanalytics.query
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as SearchAnalyticsBody;
  return withPreparedGoogleAccess(
    req,
    (config) => ({
      siteUrl: assertValidSiteUrl(body.siteUrl || config.gscSiteUrl),
      request: body.request && typeof body.request === 'object'
        ? body.request
        : buildSearchAnalyticsRequest({
            startDate: body.startDate,
            endDate: body.endDate,
            days: body.days,
            dimensions: body.dimensions,
            rowLimit: body.rowLimit,
            type: body.type,
          }),
    }),
    async ({ accessToken }, { siteUrl, request }) => {
      const data = await queryGscSearchAnalytics(accessToken, siteUrl, request);
      return {
        siteUrl,
        request,
        rows: data.rows || [],
        responseAggregationType: data.responseAggregationType || null,
        metadata: data.metadata || null,
      };
    },
  );
}
