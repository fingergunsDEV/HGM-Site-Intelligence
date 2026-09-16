import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url, userAgent } = await req.json();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ success: false, error: 'Invalid target URL provided' }, { status: 400 });
    }

    const ua = userAgent || 'Mozilla/5.0 (compatible; SiteIntelligenceBot/2.1; +https://holisticgrowthmarketing.com/bot)';
    const startTime = Date.now();

    const response = await fetch(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      next: { revalidate: 0 }
    });

    const loadTimeMs = Date.now() - startTime;
    const rawHtml = await response.text();
    const htmlSizeBytes = Buffer.byteLength(rawHtml, 'utf8');

    const $ = cheerio.load(rawHtml);
    const title = $('title').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || 
                            $('meta[property="og:description"]').attr('content')?.trim() || '';
    const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || '';
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
    const ogDescription = $('meta[property="og:description"]').attr('content')?.trim();
    const ogImage = $('meta[property="og:image"]').attr('content')?.trim();

    const h1: string[] = [];
    $('h1').each((_, el) => {
      const t = $(el).text().trim();
      if (t) h1.push(t);
    });

    const h2: string[] = [];
    $('h2').each((_, el) => {
      const t = $(el).text().trim();
      if (t) h2.push(t);
    });

    const extractedLinks: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        try {
          extractedLinks.push(new URL(href, url).href);
        } catch {
          // ignore
        }
      }
    });

    let imagesWithoutAlt = 0;
    let totalImages = 0;
    $('img').each((_, el) => {
      totalImages++;
      const alt = $(el).attr('alt');
      if (!alt || alt.trim() === '') imagesWithoutAlt++;
    });

    const jsonLdScripts: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const txt = $(el).html();
        if (txt) jsonLdScripts.push(JSON.parse(txt));
      } catch {
        // ignore
      }
    });

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText ? bodyText.split(' ').filter(w => w.length > 0).length : 0;

    return NextResponse.json({
      success: true,
      url,
      statusCode: response.status,
      statusText: response.statusText,
      loadTimeMs,
      htmlSizeBytes,
      title,
      metaDescription,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      h1,
      h2,
      wordCount,
      totalImages,
      imagesWithoutAlt,
      totalLinks: extractedLinks.length,
      extractedLinks,
      jsonLdScripts,
      rawHtml,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Live fetch failed: ${error.message || 'Network exception'}`
    }, { status: 500 });
  }
}
