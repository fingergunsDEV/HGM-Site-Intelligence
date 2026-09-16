import JSZip from 'jszip';
import { PageMetadata, AuditIssue, AISuggestion, CrawlSummary } from '@/types/site-intelligence';

export async function generateCrawlZip(
  pages: PageMetadata[],
  summary: CrawlSummary,
  suggestions: AISuggestion[]
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Schemas folder
  const schemaFolder = zip.folder('schemas');
  pages.forEach((page) => {
    const slug = page.url
      .replace(/^https?:\/\//, '')
      .replace(/[\/\?#:]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'homepage';

    const filename = `${slug}.jsonld`;
    const schemaContent = JSON.stringify(page.schemaJson || {}, null, 2);
    schemaFolder?.file(filename, schemaContent);
  });

  // 2. Audit Report CSV
  const auditHeaders = ['URL', 'Page Type', 'Issue Severity', 'Issue Code', 'Category', 'Message', 'Recommendation'];
  const auditRows: string[][] = [];

  pages.forEach((page) => {
    if (page.issues.length === 0) {
      auditRows.push([
        escapeCsv(page.url),
        escapeCsv(page.pageType),
        'PASSED',
        'CLEAN',
        'SEO',
        'No issues detected',
        'N/A'
      ]);
    } else {
      page.issues.forEach((issue) => {
        auditRows.push([
          escapeCsv(page.url),
          escapeCsv(page.pageType),
          escapeCsv(issue.type.toUpperCase()),
          escapeCsv(issue.code),
          escapeCsv(issue.category),
          escapeCsv(issue.message),
          escapeCsv(issue.recommendation)
        ]);
      });
    }
  });

  const auditCsv = [
    auditHeaders.join(','),
    ...auditRows.map(row => row.join(','))
  ].join('\n');
  zip.file('audit_report.csv', auditCsv);

  // 3. Link Graph CSV
  const linkHeaders = ['Source URL', 'Target URL', 'Source Page Type'];
  const linkRows: string[][] = [];

  pages.forEach((page) => {
    if (page.extractedLinks) {
      page.extractedLinks.forEach((target) => {
        linkRows.push([
          escapeCsv(page.url),
          escapeCsv(target),
          escapeCsv(page.pageType)
        ]);
      });
    }
  });

  const linkCsv = [
    linkHeaders.join(','),
    ...linkRows.map(row => row.join(','))
  ].join('\n');
  zip.file('link_graph.csv', linkCsv);

  // 4. AI Suggestions JSON
  zip.file('ai_suggestions.json', JSON.stringify(suggestions, null, 2));

  // 5. Crawl Summary JSON
  zip.file('crawl_summary.json', JSON.stringify(summary, null, 2));

  // 6. Readme
  const readmeText = `Site Intelligence Platform - Crawl Export
Generated: ${new Date().toISOString()}
Target Base URL: ${pages[0]?.url || 'N/A'}
Total Pages Crawled: ${pages.length}
Total Schemas Emitted: ${pages.length}

Directory Structure:
├── schemas/                # JSON-LD files ready for deployment in <head>
├── audit_report.csv        # Comprehensive SEO & Accessibility audit
├── link_graph.csv          # Directed internal link graph mapping
├── ai_suggestions.json     # Semantic topic clusters & internal linking opportunities
└── crawl_summary.json      # Metadata telemetry and response times
`;
  zip.file('README.txt', readmeText);

  return await zip.generateAsync({ type: 'blob' });
}

export async function generateCorrectedHtmlZip(
  fixResults: { url: string; correctedHtml: string; fixedIssues: string[]; validationStatus: string; updatedMetadata: PageMetadata }[],
  baseUrl: string
): Promise<Blob> {
  const zip = new JSZip();

  const htmlFolder = zip.folder('html_pages');
  const fixLogRows: string[][] = [
    ['URL', 'Status', 'Fixed Issues Count', 'Applied Modifications']
  ];

  fixResults.forEach((item) => {
    // Generate clean file path
    let filename = 'index.html';
    try {
      const parsed = new URL(item.url);
      let path = parsed.pathname;
      if (path.endsWith('/')) path = path.slice(0, -1);
      if (!path || path === '') {
        filename = 'index.html';
      } else {
        const segments = path.split('/').filter(Boolean);
        filename = segments.join('_') + '.html';
      }
    } catch {
      filename = item.url.replace(/[^a-zA-Z0-9]/g, '_') + '.html';
    }

    htmlFolder?.file(filename, item.correctedHtml);

    fixLogRows.push([
      escapeCsv(item.url),
      escapeCsv(item.validationStatus),
      String(item.fixedIssues.length),
      escapeCsv(item.fixedIssues.join('; '))
    ]);
  });

  const fixLogCsv = fixLogRows.map(r => r.join(',')).join('\n');
  zip.file('fixes_applied_report.csv', fixLogCsv);

  const deploymentGuide = `# Corrected HTML Package - Ready for Production
Target Domain: ${baseUrl}
Generated: ${new Date().toISOString()}
Total Repaired Pages: ${fixResults.length}

## Included Files:
1. \`html_pages/\`: Clean, fully validated HTML files for every URL in your sitemap.
   - Title and Meta Descriptions optimized to exact Google SERP limits.
   - Self-referencing canonical tags injected.
   - OpenGraph and Twitter Cards embedded.
   - Single H1 heading structure enforced.
   - All image alt tags restored for accessibility and image search.
   - Fully expanded Schema.org JSON-LD structured data with @id graph references.
2. \`fixes_applied_report.csv\`: Itemized list of every correction performed on each page.

## Deployment Instructions:
- **Static Hosting (Cloudflare Pages, Vercel, Netlify, S3/CloudFront)**:
  Upload the HTML files directly to their respective path destinations.
- **WordPress / CMS**:
  Copy the \`<head>\` meta tags, single \`<h1>\`, and JSON-LD schema into your theme templates or SEO plugin.
- **Next.js / Astro**:
  Import the metadata exports or embed the generated schema JSON-LD inside your layout files.
`;
  zip.file('DEPLOYMENT-GUIDE.md', deploymentGuide);

  return await zip.generateAsync({ type: 'blob' });
}


export function generateAuditCsvString(pages: PageMetadata[]): string {
  const headers = ['URL', 'Page Type', 'Status Code', 'Word Count', 'Issue Severity', 'Issue Code', 'Category', 'Message', 'Recommendation'];
  const rows: string[][] = [];

  pages.forEach((page) => {
    if (page.issues.length === 0) {
      rows.push([
        escapeCsv(page.url),
        escapeCsv(page.pageType),
        String(page.statusCode || 200),
        String(page.wordCount || 0),
        'PASSED',
        'CLEAN',
        'SEO',
        'Zero defects found',
        'N/A'
      ]);
    } else {
      page.issues.forEach((issue) => {
        rows.push([
          escapeCsv(page.url),
          escapeCsv(page.pageType),
          String(page.statusCode || 200),
          String(page.wordCount || 0),
          escapeCsv(issue.type.toUpperCase()),
          escapeCsv(issue.code),
          escapeCsv(issue.category),
          escapeCsv(issue.message),
          escapeCsv(issue.recommendation)
        ]);
      });
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function escapeCsv(str: string | undefined): string {
  if (!str) return '""';
  const clean = str.replace(/"/g, '""');
  return `"${clean}"`;
}
