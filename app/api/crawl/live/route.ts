import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { PageMetadata, AuditIssue, PageType, CrawlSummary } from '@/types/site-intelligence';

export const maxDuration = 60; // Set timeout for serverless scraping

interface LiveCrawlRequest {
  sitemapUrl?: string;
  baseUrl?: string;
  maxPages?: number;
  timeoutMs?: number;
  userAgent?: string;
  includeRobotsTxt?: boolean;
}

// Helper to determine PageType
function detectPageType(url: string, title: string, h1: string): PageType {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = (title + ' ' + h1).toLowerCase();

  if (lowerUrl === '/' || lowerUrl === '' || lowerUrl.endsWith('.com') || lowerUrl.endsWith('.com/')) return 'WebPage';
  if (lowerUrl.includes('blog') || lowerUrl.includes('post') || lowerUrl.includes('article') || lowerUrl.includes('news') || lowerUrl.includes('guide')) return 'TechArticle';
  if (lowerUrl.includes('service') || lowerUrl.includes('solution') || lowerUrl.includes('seo') || lowerUrl.includes('marketing')) return 'Service';
  if (lowerUrl.includes('contact') || lowerUrl.includes('get-in-touch')) return 'ContactPage';
  if (lowerUrl.includes('about') || lowerUrl.includes('our-story') || lowerUrl.includes('team')) return 'AboutPage';
  if (lowerUrl.includes('faq') || lowerUrl.includes('questions')) return 'FAQPage';
  if (lowerUrl.includes('product') || lowerUrl.includes('pricing') || lowerUrl.includes('shop')) return 'Product';
  if (lowerTitle.includes('service') || lowerTitle.includes('consulting') || lowerTitle.includes('agency')) return 'Service';
  
  return 'WebPage';
}

// Generate structured schema automatically
function generateSchemaForPage(page: { url: string; title: string; metaDescription: string; pageType: PageType; h1: string[] }): Record<string, any> {
  const domain = 'https://holisticgrowthmarketing.com';
  const fullUrl = page.url.startsWith('http') ? page.url : `${domain}${page.url}`;
  
  switch (page.pageType) {
    case 'Service':
      return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': page.h1[0] || page.title,
        'description': page.metaDescription || 'Professional growth marketing, technical SEO, and conversion optimization service.',
        'url': fullUrl,
        'provider': {
          '@type': 'Organization',
          'name': 'Holistic Growth Marketing',
          'url': domain
        },
        'serviceType': 'Growth Marketing & SEO Strategy'
      };
    case 'TechArticle':
      return {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'headline': page.h1[0] || page.title,
        'description': page.metaDescription,
        'url': fullUrl,
        'author': {
          '@type': 'Organization',
          'name': 'Holistic Growth Marketing'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Holistic Growth Marketing',
          'logo': {
            '@type': 'ImageObject',
            'url': `${domain}/logo.png`
          }
        },
        'datePublished': new Date().toISOString().split('T')[0]
      };
    case 'ContactPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'name': page.title,
        'url': fullUrl,
        'mainEntity': {
          '@type': 'Organization',
          'name': 'Holistic Growth Marketing',
          'email': 'jgibsonwebdesign@gmail.com'
        }
      };
    case 'AboutPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'name': page.title,
        'url': fullUrl,
        'publisher': {
          '@type': 'Organization',
          'name': 'Holistic Growth Marketing'
        }
      };
    default:
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': page.title,
        'description': page.metaDescription,
        'url': fullUrl
      };
  }
}

// Perform deep HTML auditing on live scraped DOM
function auditScrapedHtml(html: string, url: string, statusCode: number, loadTimeMs: number): PageMetadata {
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || 
                          $('meta[property="og:description"]').attr('content')?.trim() || '';
  const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || '';
  
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim();
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim();

  // Headings
  const h1: string[] = [];
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1.push(text);
  });

  const h2: string[] = [];
  $('h2').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2.push(text);
  });

  // Extract internal and external links
  const extractedLinks: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
      try {
        const parsed = new URL(href, url);
        extractedLinks.push(parsed.href);
      } catch {
        // Ignore invalid URLs
      }
    }
  });

  // Image alt audit
  let imagesWithoutAlt = 0;
  let totalImages = 0;
  $('img').each((_, el) => {
    totalImages++;
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === null || alt.trim() === '') {
      imagesWithoutAlt++;
    }
  });

  // Word count (approximate clean text)
  $('script, style, noscript, svg').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const words = bodyText.length > 0 ? bodyText.split(' ').filter(w => w.length > 0) : [];
  const wordCount = words.length;

  // JSON-LD Schema detection
  let schemaValid = false;
  let schemaJson: Record<string, any> = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (raw) {
        schemaJson = JSON.parse(raw);
        schemaValid = true;
      }
    } catch {
      schemaValid = false;
    }
  });

  const pageType = detectPageType(url, title, h1[0] || '');

  if (!schemaValid || Object.keys(schemaJson).length === 0) {
    schemaJson = generateSchemaForPage({
      url,
      title,
      metaDescription,
      pageType,
      h1
    });
  }

  // Auditing issues
  const issues: AuditIssue[] = [];

  // Title issues
  if (!title) {
    issues.push({
      id: `issue-title-missing-${Math.random().toString(36).substring(7)}`,
      type: 'critical',
      code: 'MISSING_TITLE',
      message: 'Page has no <title> tag in the HTML <head>.',
      category: 'SEO',
      recommendation: 'Add a descriptive, keyword-optimized <title> tag between 50-60 characters.'
    });
  } else if (title.length < 25) {
    issues.push({
      id: `issue-title-short-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'TITLE_TOO_SHORT',
      message: `Title length (${title.length} chars) is below the recommended minimum of 25 characters.`,
      category: 'SEO',
      recommendation: 'Expand the title tag with primary intent keywords and brand modifiers.'
    });
  } else if (title.length > 65) {
    issues.push({
      id: `issue-title-long-${Math.random().toString(36).substring(7)}`,
      type: 'notice',
      code: 'TITLE_TOO_LONG',
      message: `Title length (${title.length} chars) exceeds 65 characters and may truncate in Google SERPs.`,
      category: 'SEO',
      recommendation: 'Condense title to under 60 characters for optimal search snippet display.'
    });
  }

  // Meta description issues
  if (!metaDescription) {
    issues.push({
      id: `issue-desc-missing-${Math.random().toString(36).substring(7)}`,
      type: 'critical',
      code: 'MISSING_META_DESCRIPTION',
      message: 'Missing meta description tag. Search engines will generate automated snippets.',
      category: 'SEO',
      recommendation: 'Write an actionable 140-160 character meta description with a clear call to action.'
    });
  } else if (metaDescription.length < 50) {
    issues.push({
      id: `issue-desc-short-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'META_DESCRIPTION_TOO_SHORT',
      message: `Meta description is too short (${metaDescription.length} chars).`,
      category: 'SEO',
      recommendation: 'Expand the description to 130-160 characters for maximum CTR.'
    });
  }

  // Canonical tag
  if (!canonicalUrl) {
    issues.push({
      id: `issue-canonical-missing-${Math.random().toString(36).substring(7)}`,
      type: 'critical',
      code: 'MISSING_CANONICAL',
      message: 'Missing <link rel="canonical"> tag. Susceptible to duplicate content penalties.',
      category: 'SEO',
      recommendation: `Add <link rel="canonical" href="${url}"> to specify the primary URL index.`
    });
  }

  // H1 Headings
  if (h1.length === 0) {
    issues.push({
      id: `issue-h1-missing-${Math.random().toString(36).substring(7)}`,
      type: 'critical',
      code: 'MISSING_H1',
      message: 'No primary <h1> heading tag found on the page.',
      category: 'SEO',
      recommendation: 'Add exactly one clear, prominent <h1> tag representing the main topic.'
    });
  } else if (h1.length > 1) {
    issues.push({
      id: `issue-h1-multiple-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'MULTIPLE_H1',
      message: `Found ${h1.length} <h1> tags. Multiple H1 tags can dilute thematic relevance.`,
      category: 'SEO',
      recommendation: 'Consolidate headings so only one <h1> tag is used per page, with subheadings in <h2>-<h6>.'
    });
  }

  // Word count / thin content
  if (wordCount < 150) {
    issues.push({
      id: `issue-thin-content-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'THIN_CONTENT',
      message: `Low word count (${wordCount} words). Search engines may classify this as thin content.`,
      category: 'SEO',
      recommendation: 'Enrich page with comprehensive topic coverage, structured FAQ, or case studies.'
    });
  }

  // Missing image alts
  if (imagesWithoutAlt > 0) {
    issues.push({
      id: `issue-img-alt-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'MISSING_IMAGE_ALT',
      message: `${imagesWithoutAlt} of ${totalImages} images are missing descriptive 'alt' attributes.`,
      category: 'Accessibility',
      recommendation: 'Add contextual, screen-reader-friendly alt descriptions to all meaningful images.'
    });
  }

  // OpenGraph check
  if (!ogTitle || !ogDescription) {
    issues.push({
      id: `issue-og-missing-${Math.random().toString(36).substring(7)}`,
      type: 'notice',
      code: 'INCOMPLETE_OPENGRAPH',
      message: 'Incomplete Open Graph meta tags (og:title, og:description, og:image).',
      category: 'SEO',
      recommendation: 'Provide complete Open Graph tags for optimal social sharing and rich previews.'
    });
  }

  return {
    url,
    title: title || 'Untitled Page',
    metaDescription,
    canonicalUrl,
    h1,
    h2,
    ogTitle,
    ogDescription,
    ogImage,
    wordCount,
    statusCode,
    loadTimeMs,
    pageType,
    inlinksCount: 0,
    outlinksCount: extractedLinks.length,
    schemaValid,
    schemaJson,
    issues,
    extractedLinks,
    imagesWithoutAlt,
    totalImages,
    rawHtml: html,
    htmlSizeBytes: Buffer.byteLength(html, 'utf8'),
    isLiveFetched: true,
    lastFetchedAt: new Date().toISOString()
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: LiveCrawlRequest = await req.json();
    const sitemapUrl = body.sitemapUrl || 'https://holisticgrowthmarketing.com/sitemap.xml';
    const maxPages = Math.min(body.maxPages || 150, 500);
    const userAgent = body.userAgent || 'Mozilla/5.0 (compatible; SiteIntelligenceBot/2.1; +https://holisticgrowthmarketing.com/bot)';

    console.log(`[Live Crawler] Starting real sitemap crawl from: ${sitemapUrl} (maxPages: ${maxPages})`);

    const startTime = Date.now();
    const fetchedUrls: string[] = [];
    const discoveredSitemaps: string[] = [];

    // 1. Fetch the remote sitemap.xml
    const sitemapResponse = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/xml,text/xml,*/*'
      },
      next: { revalidate: 0 }
    });

    if (!sitemapResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch sitemap from ${sitemapUrl}: HTTP ${sitemapResponse.status} ${sitemapResponse.statusText}`
      }, { status: 400 });
    }

    const xmlContent = await sitemapResponse.text();

    // 2. Parse XML Sitemap with fast-xml-parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    const parsedXml = parser.parse(xmlContent);

    // Support sitemap index (<sitemapindex><sitemap><loc>...) and urlset (<urlset><url><loc>...)
    if (parsedXml.sitemapindex && parsedXml.sitemapindex.sitemap) {
      const sitemaps = Array.isArray(parsedXml.sitemapindex.sitemap) 
        ? parsedXml.sitemapindex.sitemap 
        : [parsedXml.sitemapindex.sitemap];
      
      for (const sm of sitemaps) {
        if (sm.loc) discoveredSitemaps.push(sm.loc);
      }

      // Fetch all discovered children sub-sitemaps
      for (const subSitemapUrl of discoveredSitemaps) {
        try {
          const subRes = await fetch(subSitemapUrl, {
            headers: { 'User-Agent': userAgent },
            next: { revalidate: 0 }
          });
          if (subRes.ok) {
            const subXml = await subRes.text();
            const subParsed = parser.parse(subXml);
            if (subParsed.urlset && subParsed.urlset.url) {
              const urls = Array.isArray(subParsed.urlset.url) ? subParsed.urlset.url : [subParsed.urlset.url];
              for (const u of urls) {
                if (u.loc && !fetchedUrls.includes(u.loc)) {
                  fetchedUrls.push(u.loc);
                }
              }
            } else {
              const locMatches = subXml.match(/<loc>(.*?)<\/loc>/g);
              if (locMatches) {
                for (const match of locMatches) {
                  const clean = match.replace(/<\/?loc>/g, '').trim();
                  if (clean && !fetchedUrls.includes(clean) && !clean.endsWith('.xml')) {
                    fetchedUrls.push(clean);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error(`Failed to parse sub-sitemap: ${subSitemapUrl}`, e);
        }
      }
    } else if (parsedXml.urlset && parsedXml.urlset.url) {
      const urls = Array.isArray(parsedXml.urlset.url) ? parsedXml.urlset.url : [parsedXml.urlset.url];
      for (const u of urls) {
        if (u.loc && !fetchedUrls.includes(u.loc)) {
          fetchedUrls.push(u.loc);
        }
      }
    } else {
      // Fallback regex extractor if XML parsing structure differs
      const locMatches = xmlContent.match(/<loc>(.*?)<\/loc>/g);
      if (locMatches) {
        for (const match of locMatches) {
          const clean = match.replace(/<\/?loc>/g, '').trim();
          if (clean && !fetchedUrls.includes(clean) && !clean.endsWith('.xml')) {
            fetchedUrls.push(clean);
          }
        }
      }
    }

    if (fetchedUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Parsed sitemap at ${sitemapUrl} but found 0 <loc> URLs.`
      }, { status: 400 });
    }

    // Ensure baseUrl / homepage is at index 0 if not present
    const cleanBaseUrl = (body.baseUrl || 'https://holisticgrowthmarketing.com').replace(/\/+$/, '');
    const hasHome = fetchedUrls.some(u => u === cleanBaseUrl || u === `${cleanBaseUrl}/`);
    if (!hasHome) {
      fetchedUrls.unshift(`${cleanBaseUrl}/`);
    }

    // Limit pages to maxPages
    const targetUrls = fetchedUrls.slice(0, maxPages);
    console.log(`[Live Crawler] Extracted ${fetchedUrls.length} real URLs from sitemap. Crawling ${targetUrls.length} pages...`);

    // 3. Scrape each URL live with bounded concurrency
    const auditedPages: PageMetadata[] = [];
    const concurrency = 6;
    
    for (let i = 0; i < targetUrls.length; i += concurrency) {
      const chunk = targetUrls.slice(i, i + concurrency);
      
      const chunkPromises = chunk.map(async (targetUrl) => {
        const pageStart = Date.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            signal: controller.signal,
            next: { revalidate: 0 }
          });

          clearTimeout(timeout);
          const loadTimeMs = Date.now() - pageStart;
          const html = await response.text();

          return auditScrapedHtml(html, targetUrl, response.status, loadTimeMs);
        } catch (err: any) {
          const loadTimeMs = Date.now() - pageStart;
          const isTimeout = err.name === 'AbortError';

          const failedPage: PageMetadata = {
            url: targetUrl,
            title: 'Failed to Load Page',
            metaDescription: '',
            canonicalUrl: '',
            h1: [],
            h2: [],
            wordCount: 0,
            statusCode: isTimeout ? 408 : 500,
            loadTimeMs,
            pageType: 'WebPage',
            inlinksCount: 0,
            outlinksCount: 0,
            schemaValid: false,
            schemaJson: {},
            extractedLinks: [],
            imagesWithoutAlt: 0,
            totalImages: 0,
            issues: [
              {
                id: `issue-fetch-fail-${Math.random().toString(36).substring(7)}`,
                type: 'critical',
                code: isTimeout ? 'REQUEST_TIMEOUT' : 'FETCH_ERROR',
                message: isTimeout ? 'Page request timed out after 12s.' : `HTTP connection error: ${err.message || 'Unknown network error'}`,
                category: 'Performance',
                recommendation: 'Check server availability, DNS propagation, and firewall rate-limiting.'
              }
            ]
          };
          return failedPage;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      auditedPages.push(...chunkResults);
    }

    // 4. Calculate actual inlinks & link graph connectivity
    const allPageUrls = new Set(auditedPages.map(p => p.url));
    const urlMap = new Map(auditedPages.map(p => [p.url, p]));

    for (const page of auditedPages) {
      for (const extracted of page.extractedLinks) {
        // If extracted link is in our crawled inventory, increase inlinksCount
        if (allPageUrls.has(extracted) && extracted !== page.url) {
          const targetObj = urlMap.get(extracted);
          if (targetObj) {
            targetObj.inlinksCount = (targetObj.inlinksCount || 0) + 1;
          }
        }
      }
    }

    // Check for orphan pages (0 inlinks except home page)
    for (const page of auditedPages) {
      const isHome = page.url.endsWith('.com/') || page.url.endsWith('.com') || page.url.split('/').length <= 4;
      if (!isHome && page.inlinksCount === 0) {
        page.issues.push({
          id: `issue-orphan-${Math.random().toString(36).substring(7)}`,
          type: 'warning',
          code: 'ORPHAN_PAGE',
          message: 'Zero internal inlinks found within crawled sitemap pages.',
          category: 'Links',
          recommendation: 'Add contextual internal links from high-authority topic clusters and category hubs.'
        });
      }
    }

    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const criticalCount = auditedPages.reduce((acc, p) => acc + p.issues.filter(i => i.type === 'critical').length, 0);
    const warningCount = auditedPages.reduce((acc, p) => acc + p.issues.filter(i => i.type === 'warning').length, 0);

    const summary: CrawlSummary = {
      taskId: `live-crawl-${Date.now()}`,
      status: 'done',
      totalPages: fetchedUrls.length,
      crawledPages: auditedPages.length,
      percent: 100,
      criticalIssuesCount: criticalCount,
      warningIssuesCount: warningCount,
      noticeIssuesCount: auditedPages.reduce((acc, p) => acc + p.issues.filter(i => i.type === 'notice').length, 0),
      totalLinksFound: auditedPages.reduce((acc, p) => acc + (p.extractedLinks?.length || 0), 0),
      schemasGeneratedCount: auditedPages.filter(p => p.schemaValid).length,
      aiSuggestionsCount: 0,
      elapsedSeconds: Math.round(elapsedSeconds),
      avgResponseTimeMs: Math.round(auditedPages.reduce((acc, p) => acc + p.loadTimeMs, 0) / (auditedPages.length || 1)),
      startTime,
      endTime: Date.now()
    };

    return NextResponse.json({
      success: true,
      source: 'live-sitemap',
      sitemapUrl,
      totalSitemapUrls: fetchedUrls.length,
      crawledCount: auditedPages.length,
      summary,
      pages: auditedPages
    });

  } catch (error: any) {
    console.error('[Live Crawler Error]', error);
    return NextResponse.json({
      success: false,
      error: `Failed to crawl live sitemap: ${error.message || 'Internal crawler exception'}`
    }, { status: 500 });
  }
}
