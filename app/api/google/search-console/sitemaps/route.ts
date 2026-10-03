import { NextRequest } from 'next/server';
import { withPreparedGoogleAccess } from '@/lib/google/auth';
import { assertValidSiteUrl, listGscSitemaps } from '@/lib/google/search-console';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/google/search-console/sitemaps?siteUrl=...&sitemapIndex=... -> sitemaps.list
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  return withPreparedGoogleAccess(
    req,
    (config) => ({
      siteUrl: assertValidSiteUrl(params.get('siteUrl') || config.gscSiteUrl),
      sitemapIndex: params.get('sitemapIndex') || undefined,
    }),
    async ({ accessToken }, { siteUrl, sitemapIndex }) => {
      const data = await listGscSitemaps(accessToken, siteUrl, sitemapIndex);
      return { siteUrl, sitemaps: data.sitemap || [] };
    },
  );
}
