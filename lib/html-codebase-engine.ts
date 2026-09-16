import { PageMetadata, AuditIssue, PageType, CodebaseItem } from '@/types/site-intelligence';
import { auditPage, generateSchema } from './crawler-engine';

/**
 * Parses raw HTML string into structured PageMetadata and runs technical SEO audit
 */
export function parseAndAuditHtml(
  html: string,
  urlOrPath: string = 'https://holisticgrowthmarketing.com/custom-page.html'
): PageMetadata {
  let url = urlOrPath;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://holisticgrowthmarketing.com${url.startsWith('/') ? url : '/' + url}`;
  }

  // 1. Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // 2. Extract <meta name="description">
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const metaDescription = descMatch ? descMatch[1].trim() : '';

  // 3. Extract <link rel="canonical">
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                         html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : '';

  // 4. Extract OpenGraph & Twitter
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);

  // 5. Extract Headings (H1, H2)
  const h1: string[] = [];
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let match;
  while ((match = h1Regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) h1.push(text);
  }

  const h2: string[] = [];
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  while ((match = h2Regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) h2.push(text);
  }

  // 6. Extract Images & Check Alt attributes
  const imgRegex = /<img\s+([^>]*?)>/gi;
  let totalImages = 0;
  let imagesWithoutAlt = 0;
  while ((match = imgRegex.exec(html)) !== null) {
    totalImages++;
    const attrs = match[1];
    const hasAlt = /alt=["']([^"']*)["']/i.test(attrs);
    if (!hasAlt) {
      imagesWithoutAlt++;
    } else {
      const altVal = attrs.match(/alt=["']([^"']*)["']/i)?.[1]?.trim();
      if (!altVal) imagesWithoutAlt++;
    }
  }

  // 7. Extract Links
  const extractedLinks: string[] = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();
    if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
      if (!extractedLinks.includes(href)) {
        extractedLinks.push(href);
      }
    }
  }

  // 8. Extract & Validate JSON-LD Schema
  let schemaValid = false;
  let schemaJson: Record<string, any> = {};
  const schemaRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = schemaRegex.exec(html)) !== null) {
    try {
      const rawJson = match[1].trim();
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        schemaJson = parsed;
        if (parsed['@context'] && parsed['@type']) {
          schemaValid = true;
        }
      }
    } catch {
      schemaValid = false;
    }
  }

  // 9. Estimate Word Count (Strip HTML tags)
  const bodyText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

  // 10. Infer PageType
  let pageType: PageType = 'WebPage';
  if (url.includes('/blog/') || url.includes('/guide') || url.includes('/article')) {
    pageType = 'TechArticle';
  } else if (url.includes('/services/') || url.includes('/service')) {
    pageType = 'Service';
  } else if (url.includes('/product/')) {
    pageType = 'Product';
  } else if (url.includes('/faq')) {
    pageType = 'FAQPage';
  } else if (url.endsWith('/') || url === 'https://holisticgrowthmarketing.com') {
    pageType = 'Organization';
  }

  // If no schema was found in HTML, generate suggested structured schema
  if (!schemaValid || Object.keys(schemaJson).length === 0) {
    schemaJson = generateSchema({
      url,
      title: title || 'Web Page',
      pageType,
      metaDescription,
      h1
    }, 'https://holisticgrowthmarketing.com');
  }



  // Assemble PageMetadata
  const metadata: PageMetadata = {
    url,
    title,
    metaDescription,
    canonicalUrl,
    h1,
    h2,
    ogTitle: ogTitleMatch ? ogTitleMatch[1].trim() : undefined,
    ogDescription: ogDescMatch ? ogDescMatch[1].trim() : undefined,
    ogImage: ogImageMatch ? ogImageMatch[1].trim() : undefined,
    wordCount,
    statusCode: 200,
    loadTimeMs: 145,
    pageType,
    inlinksCount: 1,
    outlinksCount: extractedLinks.length,
    schemaValid,
    schemaJson,
    issues: [],
    extractedLinks,
    imagesWithoutAlt,
    totalImages
  };

  // Run audit engine
  const issues = auditPage(metadata);

  // Additional HTML-specific audits
  if (!html.includes('<!DOCTYPE html>')) {
    issues.push({
      id: `doctype-missing-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'DOCTYPE_MISSING',
      category: 'Performance',
      message: 'Missing standard <!DOCTYPE html> declaration.',
      recommendation: 'Add <!DOCTYPE html> at the very beginning of the document to trigger standards mode.'
    });
  }

  if (!/<html[^>]*lang=["'][^"']+["']/i.test(html)) {
    issues.push({
      id: `lang-missing-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'HTML_LANG_MISSING',
      category: 'Accessibility',
      message: 'The <html> element is missing a lang attribute (e.g. lang="en").',
      recommendation: 'Declare <html lang="en"> for internationalization and screen reader compatibility.'
    });
  }

  if (!/<meta[^>]*name=["']viewport["']/i.test(html)) {
    issues.push({
      id: `viewport-missing-${Math.random().toString(36).substring(7)}`,
      type: 'critical',
      code: 'VIEWPORT_MISSING',
      category: 'Performance',
      message: 'Missing responsive viewport meta tag.',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>.'
    });
  }

  metadata.issues = issues;
  return metadata;
}

/**
 * Injects or updates a <title> tag in the HTML head
 */
export function injectTitle(html: string, newTitle: string): string {
  if (/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${newTitle}</title>`);
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `  <title>${newTitle}</title>\n</head>`);
  }
  return `<title>${newTitle}</title>\n` + html;
}

/**
 * Injects or updates meta description in HTML head
 */
export function injectMetaDescription(html: string, description: string): string {
  const metaTag = `<meta name="description" content="${description}">`;
  if (/<meta[^>]*name=["']description["'][^>]*>/i.test(html)) {
    return html.replace(/<meta[^>]*name=["']description["'][^>]*content=["'][^"']*["'][^>]*>/i, metaTag);
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `  ${metaTag}\n</head>`);
  }
  return `${metaTag}\n` + html;
}

/**
 * Injects or updates canonical URL link in HTML head
 */
export function injectCanonical(html: string, canonicalUrl: string): string {
  const linkTag = `<link rel="canonical" href="${canonicalUrl}">`;
  if (/<link[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link[^>]*rel=["']canonical["'][^>]*href=["'][^"']*["'][^>]*>/i, linkTag);
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `  ${linkTag}\n</head>`);
  }
  return `${linkTag}\n` + html;
}

/**
 * Injects OpenGraph meta tags in HTML head
 */
export function injectOpenGraph(
  html: string,
  og: { title?: string; description?: string; image?: string; url?: string }
): string {
  const tags: string[] = [];
  if (og.title) tags.push(`  <meta property="og:title" content="${og.title}">`);
  if (og.description) tags.push(`  <meta property="og:description" content="${og.description}">`);
  if (og.image) tags.push(`  <meta property="og:image" content="${og.image}">`);
  if (og.url) tags.push(`  <meta property="og:url" content="${og.url}">`);
  tags.push('  <meta property="og:type" content="website">');

  const block = tags.join('\n');
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${block}\n</head>`);
  }
  return block + '\n' + html;
}

/**
 * Injects JSON-LD Schema Script in HTML head
 */
export function injectJsonLd(html: string, schema: Record<string, any>): string {
  const scriptTag = `  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2).split('\n').map(l => '  ' + l).join('\n')}\n  </script>`;
  if (/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i.test(html)) {
    return html.replace(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i, scriptTag.trim());
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${scriptTag}\n</head>`);
  }
  return `${scriptTag}\n` + html;
}

/**
 * Fixes missing alt attributes on <img> tags
 */
export function fixMissingImageAlts(html: string, defaultAlt: string = 'Illustrative graphic for content section'): string {
  return html.replace(/<img\s+([^>]*?)>/gi, (fullMatch, attrs) => {
    if (!/alt=["']/i.test(attrs)) {
      return `<img ${attrs} alt="${defaultAlt}">`;
    }
    // If alt is empty: alt=""
    if (/alt=["']\s*["']/i.test(attrs)) {
      return `<img ${attrs.replace(/alt=["']\s*["']/i, `alt="${defaultAlt}"`)}>`;
    }
    return fullMatch;
  });
}

/**
 * Initial Default Codebase Template File Tree
 */
export const INITIAL_CODEBASE_FILES: CodebaseItem[] = [
  {
    id: 'root-dir',
    name: 'project-root',
    path: '/',
    type: 'directory',
    parentId: null
  },
  {
    id: 'file-index-html',
    name: 'index.html',
    path: '/index.html',
    type: 'file',
    extension: 'html',
    parentId: 'root-dir',
    size: 2150,
    lastModified: 'Today',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Holistic Growth Marketing | Scale Organic Traffic & Revenue</title>
  <meta name="description" content="Holistic growth marketing strategies integrating technical SEO, schema optimization, content clustering, and CRO for high-growth B2B brands.">
  <link rel="canonical" href="https://holisticgrowthmarketing.com/">
  <meta property="og:title" content="Holistic Growth Marketing | Scale Organic Traffic">
  <meta property="og:description" content="Data-driven technical SEO, entity architecture, and organic conversion pipelines.">
  <meta property="og:type" content="website">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Holistic Growth Marketing",
    "url": "https://holisticgrowthmarketing.com/",
    "logo": "https://holisticgrowthmarketing.com/assets/logo.png",
    "description": "Enterprise Technical SEO and Organic Growth Consultancy"
  }
  </script>
</head>
<body class="font-sans antialiased text-slate-900 bg-white">
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/services/technical-seo.html">Technical SEO</a>
      <a href="/blog/internal-linking-guide.html">Blog</a>
      <a href="/contact.html">Contact</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <h1>Data-Driven Holistic Growth Marketing</h1>
      <p>Transform organic search visibility into sustainable recurring revenue pipelines through technical precision and semantic authority.</p>
      <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800" alt="Holistic growth analytics chart and organic search traffic metrics" width="800" height="450">
    </section>

    <section class="pillars">
      <h2>Our 4-Pillar Growth Engine</h2>
      <p>From deep architectural crawl audits to automated schema graph deployment, we eliminate indexing friction and command top SERP rankings.</p>
    </section>
  </main>
</body>
</html>`
  },
  {
    id: 'file-about-html',
    name: 'about.html',
    path: '/about.html',
    type: 'file',
    extension: 'html',
    parentId: 'root-dir',
    size: 1420,
    lastModified: 'Today',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About Holistic Growth Marketing | Enterprise SEO Agency</title>
  <meta name="description" content="Learn about our team of data scientists, SEO engineers, and content architects dedicated to scaling enterprise search visibility.">
  <link rel="canonical" href="https://holisticgrowthmarketing.com/about.html">
</head>
<body>
  <h1>About Our Growth Philosophy</h1>
  <p>We blend graph theory, semantic web standards, and conversion rate optimization to build enduring search advantages for modern companies.</p>
  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800" alt="Our executive strategy team collaborating on technical SEO architecture">
</body>
</html>`
  },
  {
    id: 'dir-services',
    name: 'services',
    path: '/services',
    type: 'directory',
    parentId: 'root-dir'
  },
  {
    id: 'file-service-tech-seo',
    name: 'technical-seo.html',
    path: '/services/technical-seo.html',
    type: 'file',
    extension: 'html',
    parentId: 'dir-services',
    size: 2600,
    lastModified: 'Today',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enterprise Technical SEO Audits & Implementation Services</title>
  <meta name="description" content="Fix crawl budgets, rendering bottlenecks, core web vitals, and structured data hierarchy to dominate organic search results.">
  <link rel="canonical" href="https://holisticgrowthmarketing.com/services/technical-seo.html">
</head>
<body>
  <header>
    <a href="/">Home</a> | <a href="/services/technical-seo.html">Technical SEO</a>
  </header>
  <main>
    <h1>Technical SEO Architecture & Auditing</h1>
    <p>Comprehensive code-level diagnosis of server response times, canonical loops, orphan pages, and JavaScript rendering barriers.</p>
    
    <h2>Crawl Optimization & Log Analysis</h2>
    <p>We analyze server log files and Googlebot access patterns to eliminate wasted crawl budget and ensure vital high-converting assets are indexed rapidly.</p>

    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800" alt="Server log analysis dashboard illustrating crawl frequency">
  </main>
</body>
</html>`
  },
  {
    id: 'dir-blog',
    name: 'blog',
    path: '/blog',
    type: 'directory',
    parentId: 'root-dir'
  },
  {
    id: 'file-blog-internal-linking',
    name: 'internal-linking-guide.html',
    path: '/blog/internal-linking-guide.html',
    type: 'file',
    extension: 'html',
    parentId: 'dir-blog',
    size: 3200,
    lastModified: 'Today',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Definitive Guide to Internal Link Graphs for SEO (2026)</title>
  <meta name="description" content="How to structure internal PageRank flow, eliminate orphan pages, and build algorithmic topic relevance across your website.">
  <link rel="canonical" href="https://holisticgrowthmarketing.com/blog/internal-linking-guide.html">
</head>
<body>
  <article>
    <h1>The Definitive Guide to Internal Link Graphs</h1>
    <p>Internal linking is the single most controllable lever in technical SEO. By structuring internal equity flow and semantic anchor relationships, search crawlers understand topical hierarchy instantaneously.</p>

    <h2>Hub & Spoke Architecture</h2>
    <p>Connecting pillar articles directly with cluster subtopics concentrates domain authority and prevents crawl fragmentation.</p>

    <img src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800" alt="Network graph visualization of internal link relationships">
  </article>
</body>
</html>`
  },
  {
    id: 'file-sitemap-xml',
    name: 'sitemap.xml',
    path: '/sitemap.xml',
    type: 'file',
    extension: 'xml',
    parentId: 'root-dir',
    size: 980,
    lastModified: 'Today',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://holisticgrowthmarketing.com/</loc>
    <lastmod>2026-08-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://holisticgrowthmarketing.com/about.html</loc>
    <lastmod>2026-08-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://holisticgrowthmarketing.com/services/technical-seo.html</loc>
    <lastmod>2026-08-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://holisticgrowthmarketing.com/blog/internal-linking-guide.html</loc>
    <lastmod>2026-08-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`
  },
  {
    id: 'file-robots-txt',
    name: 'robots.txt',
    path: '/robots.txt',
    type: 'file',
    extension: 'txt',
    parentId: 'root-dir',
    size: 240,
    lastModified: 'Today',
    content: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

Sitemap: https://holisticgrowthmarketing.com/sitemap.xml`
  }
];
