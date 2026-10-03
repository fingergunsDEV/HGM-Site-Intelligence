import { NextRequest } from 'next/server';
import { withPreparedGoogleAccess } from '@/lib/google/auth';
import { assertValidSiteUrl, inspectGscUrl } from '@/lib/google/search-console';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InspectionBody {
  inspectionUrl?: string;
  siteUrl?: string;
  languageCode?: string;
}

// POST /api/google/search-console/url-inspection -> urlInspection.index.inspect
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as InspectionBody;
  return withPreparedGoogleAccess(
    req,
    (config) => {
      const inspectionUrl = (body.inspectionUrl || '').trim();
      if (!/^https?:\/\//i.test(inspectionUrl)) {
        throw new Error('inspectionUrl must be a fully-qualified http(s) URL under the Search Console property.');
      }
      return { siteUrl: assertValidSiteUrl(body.siteUrl || config.gscSiteUrl), inspectionUrl };
    },
    async ({ accessToken }, { siteUrl, inspectionUrl }) => {
      const data = await inspectGscUrl(accessToken, {
        inspectionUrl,
        siteUrl,
        languageCode: body.languageCode || 'en-US',
      });
      return { siteUrl, inspectionUrl, inspectionResult: data.inspectionResult || null };
    },
  );
}
