import { NextRequest } from 'next/server';
import { withPreparedGoogleAccess } from '@/lib/google/auth';
import {
  Ga4RunReportRequest,
  buildTopPagesReportRequest,
  flattenGa4Report,
  normalizeGa4PropertyId,
  runGa4Report,
} from '@/lib/google/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ReportBody {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  /** Optional full RunReportRequest; overrides the default top-pages report. */
  request?: Ga4RunReportRequest;
}

// POST /api/google/analytics/report
// Runs a GA4 Data API report (properties.runReport). Defaults to top pages for the last 28 days.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as ReportBody;
  return withPreparedGoogleAccess(
    req,
    (config) => ({
      propertyId: normalizeGa4PropertyId(body.propertyId || config.ga4PropertyId),
      request: body.request && typeof body.request === 'object'
        ? body.request
        : buildTopPagesReportRequest({ startDate: body.startDate, endDate: body.endDate, limit: body.limit }),
    }),
    async ({ accessToken }, { propertyId, request }) => {
      const report = await runGa4Report(accessToken, propertyId, request);
      return {
        propertyId,
        request,
        rows: flattenGa4Report(report),
        rowCount: report.rowCount ?? 0,
        dimensionHeaders: report.dimensionHeaders || [],
        metricHeaders: report.metricHeaders || [],
        report,
      };
    },
  );
}
