import { NextRequest } from 'next/server';
import { withGoogleAccess } from '@/lib/google/auth';
import { listGa4AccountSummaries } from '@/lib/google/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/google/analytics/properties?pageToken=...
// Lists GA4 accounts and properties via the Admin API accountSummaries.list.
export async function GET(req: NextRequest) {
  return withGoogleAccess(req, async ({ accessToken, config }) => {
    const pageToken = req.nextUrl.searchParams.get('pageToken') || undefined;
    const data = await listGa4AccountSummaries(accessToken, { pageSize: 200, pageToken });
    const properties = (data.accountSummaries || []).flatMap((account) =>
      (account.propertySummaries || []).map((p) => ({
        propertyId: p.property.replace(/^properties\//, ''),
        displayName: p.displayName,
        accountName: account.displayName,
        propertyType: p.propertyType,
      })),
    );
    return {
      properties,
      accountSummaries: data.accountSummaries || [],
      nextPageToken: data.nextPageToken || null,
      defaultPropertyId: config.ga4PropertyId || null,
    };
  });
}
