import { NextRequest } from 'next/server';
import { withGoogleAccess } from '@/lib/google/auth';
import { listGscSites } from '@/lib/google/search-console';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/google/search-console/sites -> Search Console sites.list
export async function GET(req: NextRequest) {
  return withGoogleAccess(req, async ({ accessToken, config }) => {
    const data = await listGscSites(accessToken);
    return {
      sites: data.siteEntry || [],
      defaultSiteUrl: config.gscSiteUrl || null,
    };
  });
}
