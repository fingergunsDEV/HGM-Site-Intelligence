import { CrawlConfig, PageMetadata, PageType, AuditIssue, LinkEdge, AISuggestion, LogMessage } from '@/types/site-intelligence';

export const DEFAULT_CONFIG: CrawlConfig = {
  sitemap: 'https://holisticgrowthmarketing.com/sitemap.xml',
  output_dir: './schemas',
  base_url: 'https://holisticgrowthmarketing.com',
  delay: 0.2,
  concurrency: 4,
  cache_dir: './html_cache',
  no_fetch: false,
  no_cache: false,
  audit: true,
  link_graph: true,
  ai_suggest: true,
  schema_fix: true,
  max_pages: 150,
  user_agent: 'Mozilla/5.0 (compatible; SiteIntelligenceBot/2.1; +https://holisticgrowthmarketing.com/bot)',
  url_filter_regex: '',
  exclude_paths: '/admin, /login, /cart',
  obey_robots: true,
  timeout_seconds: 10,
};

export const SITE_PRESETS: { name: string; baseUrl: string; sitemap: string; description: string; pages: Partial<PageMetadata>[] }[] = [
  {
    name: 'Holistic Growth Marketing',
    baseUrl: 'https://holisticgrowthmarketing.com',
    sitemap: 'https://holisticgrowthmarketing.com/sitemap.xml',
    description: 'Enterprise Search Intelligence & AI Infrastructure (Live Site)',
    pages: [
      {
        url: 'https://holisticgrowthmarketing.com/',
        title: 'Holistic Growth Marketing | Search Intelligence Infrastructure',
        metaDescription: 'Enterprise search intelligence, agentic data pipelines, and owned growth infrastructure. Built by engineers, for organizations that need to own their intelligence.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/',
        h1: ['Search intelligenceinfrastructure'],
        h2: ['Stop Renting. Start Owning.', 'Engineering-Led Search Architecture', 'Autonomous Data Pipelines', 'Engineering Logs & Manifestos'],
        wordCount: 1680,
        statusCode: 200,
        pageType: 'Organization',
        imagesWithoutAlt: 0,
        totalImages: 12,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/about',
          'https://holisticgrowthmarketing.com/blogs/aeo-architecture-guide',
          'https://holisticgrowthmarketing.com/blogs/agentic-marketing-systems',
          'https://holisticgrowthmarketing.com/blogs/schema-markup-guide',
          'https://holisticgrowthmarketing.com/blogs/saas-vs-owned-infrastructure',
          'https://holisticgrowthmarketing.com/blogs/search-console-api-appscript-guide'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/about',
        title: 'About Holistic Growth Marketing – Engineering-Led Agency',
        metaDescription: 'We are an engineering-led agency based in Los Angeles, building sovereign AI infrastructure. Our team specializes in autonomous systems, technical SEO, and custom CRM automation.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/about',
        h1: ['Jason Gibson.'],
        h2: ['Stop Renting. Start Owning.', 'Proprietary Systems.', 'GitHub Repositories.', 'Engineering Capabilities.'],
        wordCount: 1240,
        statusCode: 200,
        pageType: 'AboutPage',
        imagesWithoutAlt: 0,
        totalImages: 6,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/blogs/agentic-marketing-systems',
          'https://holisticgrowthmarketing.com/blogs/aeo-architecture-guide',
          'https://holisticgrowthmarketing.com/blogs/saas-vs-owned-infrastructure'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/aeo-architecture-guide',
        title: 'AEO Architecture Guide | Holistic Growth Marketing',
        metaDescription: 'Complete architectural blueprint for Answer Engine Optimization (AEO), LLM entity indexing, structured data schemas, and generative search visibility.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/aeo-architecture-guide',
        h1: ['AEO Architecture: Optimizing for Answer Engines and LLMs'],
        h2: ['The Shift from SERP to Synthesis', 'Entity Disambiguation and Knowledge Triples', 'JSON-LD Graph Architecture', 'Real-Time Verification'],
        wordCount: 2840,
        statusCode: 200,
        pageType: 'TechArticle',
        imagesWithoutAlt: 0,
        totalImages: 8,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/about',
          'https://holisticgrowthmarketing.com/blogs/schema-markup-guide',
          'https://holisticgrowthmarketing.com/blogs/agentic-marketing-systems'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/agentic-marketing-systems',
        title: 'Autonomous Agentic Marketing Systems | HGM Engineering',
        metaDescription: 'How autonomous LLM agents and deterministic Python workflows eliminate repetitive marketing operations and continuously audit technical SEO health.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/agentic-marketing-systems',
        h1: ['Autonomous Agentic Marketing Infrastructure'],
        h2: ['Why Deterministic Code Trumps SaaS Bloat', 'Multi-Agent Auditing Loops', 'Automated Schema Deployment Pipelines'],
        wordCount: 3120,
        statusCode: 200,
        pageType: 'TechArticle',
        imagesWithoutAlt: 0,
        totalImages: 7,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/about',
          'https://holisticgrowthmarketing.com/blogs/aeo-architecture-guide',
          'https://holisticgrowthmarketing.com/blogs/saas-vs-owned-infrastructure'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/schema-markup-guide',
        title: 'Complete Enterprise Schema Markup Guide (2026)',
        metaDescription: 'A technical engineering guide to implementing schema.org JSON-LD microdata, @id linking, nested organization entities, and AI Overview indexing.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/schema-markup-guide',
        h1: ['Enterprise Schema Markup & JSON-LD Engineering'],
        h2: ['Core Schema Vocabularies', 'Top-Level @graph Interconnections', 'Validating Against Google Rich Results'],
        wordCount: 2650,
        statusCode: 200,
        pageType: 'TechArticle',
        imagesWithoutAlt: 0,
        totalImages: 9,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/blogs/aeo-architecture-guide',
          'https://holisticgrowthmarketing.com/about'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/saas-vs-owned-infrastructure',
        title: 'SaaS vs. Owned Infrastructure: The Sovereign Marketing Stack',
        metaDescription: 'Why high-growth technical companies are migrating away from subscription SaaS tooling in favor of owned Python, Node, and Google Cloud infrastructure.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/saas-vs-owned-infrastructure',
        h1: ['SaaS vs. Owned Infrastructure for Modern Growth'],
        h2: ['The $100k/Year SaaS Tax', 'Data Sovereignty and Direct API Access', 'Custom Scripted Workflows'],
        wordCount: 2210,
        statusCode: 200,
        pageType: 'TechArticle',
        imagesWithoutAlt: 0,
        totalImages: 5,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/about',
          'https://holisticgrowthmarketing.com/blogs/agentic-marketing-systems'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/5-seo-mistakes-killing-your-local-rankings',
        title: '5 SEO Mistakes Killing Your Local Rankings | HGM',
        metaDescription: 'Avoid critical local technical SEO errors: NAP inconsistency, missing LocalBusiness structured data, broken internal link equity, and orphan pages.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/5-seo-mistakes-killing-your-local-rankings',
        h1: ['5 Technical SEO Mistakes Killing Local Rankings'],
        h2: ['1. Schema Markup Omission', '2. Poor Internal Link Graphs', '3. Slow Core Web Vitals', '4. Crawl Budget Waste'],
        wordCount: 1940,
        statusCode: 200,
        pageType: 'TechArticle',
        imagesWithoutAlt: 1,
        totalImages: 6,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/about',
          'https://holisticgrowthmarketing.com/blogs/schema-markup-guide'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/search-console-api-appscript-guide',
        title: 'Automating Google Search Console API with Apps Script | HGM',
        metaDescription: 'Step-by-step tutorial on pulling organic search performance metrics directly into Google Sheets and BigQuery via Google Apps Script and automated triggers.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/search-console-api-appscript-guide',
        h1: ['Automating Google Search Console API via Apps Script'],
        h2: ['Setting Up GCP OAuth', 'Writing the Apps Script Fetcher', 'Automated Daily Slack & Email Alerts'],
        wordCount: 2400,
        statusCode: 200,
        pageType: 'TechArticle',
        imagesWithoutAlt: 0,
        totalImages: 8,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/blogs/marketing-intelligence-google-apps-script'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/marketing-intelligence-google-apps-script',
        title: 'Marketing Intelligence with Google Apps Script | HGM',
        metaDescription: 'Build serverless marketing intelligence dashboards using Google Workspace, Apps Script, and external REST APIs.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/marketing-intelligence-google-apps-script',
        h1: ['Marketing Intelligence with Google Apps Script'],
        h2: ['Serverless Data Extraction', 'Scheduled Webhook Dispatches', 'Integrating with BigQuery'],
        wordCount: 2150,
        statusCode: 200,
        pageType: 'TechArticle',
        imagesWithoutAlt: 0,
        totalImages: 6,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/blogs/search-console-api-appscript-guide'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/google-maps-lead-generation',
        title: 'Automated Google Maps Lead Generation Infrastructure',
        metaDescription: 'Extract high-intent local B2B prospects programmatically with Places API, enriched metadata, and autonomous CRM routing.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/google-maps-lead-generation',
        h1: ['Automated Google Maps Lead Generation'],
        h2: ['Places API Integration', 'Data Enrichment Pipeline', 'CRM Ingestion'],
        wordCount: 1880,
        statusCode: 200,
        pageType: 'TechArticle',
        imagesWithoutAlt: 0,
        totalImages: 4,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/about'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/blogs/affordable-seo-beverly-hills',
        title: 'Affordable SEO in Beverly Hills & Greater Los Angeles',
        metaDescription: 'Data-driven local SEO and schema engineering tailored for luxury, legal, and medical practices across Beverly Hills and Los Angeles.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/blogs/affordable-seo-beverly-hills',
        h1: ['Local SEO Architecture in Beverly Hills & Los Angeles'],
        h2: ['High-Intent Keyword Targeting', 'Geo-Targeted Schema Markup', 'Local Knowledge Graph Citations'],
        wordCount: 1750,
        statusCode: 200,
        pageType: 'LocalBusiness',
        imagesWithoutAlt: 0,
        totalImages: 5,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/about',
          'https://holisticgrowthmarketing.com/blogs/5-seo-mistakes-killing-your-local-rankings'
        ]
      },
      {
        url: 'https://holisticgrowthmarketing.com/404',
        title: 'Page Not Found | Holistic Growth Marketing',
        metaDescription: 'The requested resource could not be found.',
        canonicalUrl: 'https://holisticgrowthmarketing.com/404',
        h1: ['Lost?'],
        h2: ['Recommended Pages', 'Return Home'],
        wordCount: 320,
        statusCode: 200,
        pageType: 'WebPage',
        imagesWithoutAlt: 0,
        totalImages: 2,
        extractedLinks: [
          'https://holisticgrowthmarketing.com/',
          'https://holisticgrowthmarketing.com/about'
        ]
      }
    ]
  },
  {
    name: 'TechSaaS Nexus',
    baseUrl: 'https://techsaas-nexus.io',
    sitemap: 'https://techsaas-nexus.io/sitemap.xml',
    description: 'Enterprise Cloud Observability & Microservices Monitoring',
    pages: [
      {
        url: 'https://techsaas-nexus.io/',
        title: 'Nexus Cloud Observability | Unified Tracing & Metrics Platform',
        metaDescription: 'Correlate distributed logs, traces, and metrics with autonomous root cause analysis. Built for Kubernetes microservices.',
        canonicalUrl: 'https://techsaas-nexus.io/',
        h1: ['Next-Gen Cloud Observability for High-Velocity Teams'],
        h2: ['Full-Stack Tracing', 'AI Root Cause Analysis', 'Enterprise Security Compliance'],
        wordCount: 1650,
        statusCode: 200,
        pageType: 'Organization',
        imagesWithoutAlt: 0,
        totalImages: 10,
        extractedLinks: [
          'https://techsaas-nexus.io/product/apm',
          'https://techsaas-nexus.io/product/log-management',
          'https://techsaas-nexus.io/pricing',
          'https://techsaas-nexus.io/docs/quickstart',
          'https://techsaas-nexus.io/blog/kubernetes-monitoring-2026'
        ]
      },
      {
        url: 'https://techsaas-nexus.io/product/apm',
        title: 'Nexus APM | Application Performance Monitoring for Node, Go & Java',
        metaDescription: 'Low-overhead eBPF agents deliver code-level transaction traces without manual instrumentation.',
        canonicalUrl: 'https://techsaas-nexus.io/product/apm',
        h1: ['Autonomous Application Performance Monitoring'],
        h2: ['eBPF Deep Packet Inspection', 'Zero-Code Profiling', 'Flamegraphs & Bottlenecks'],
        wordCount: 1950,
        statusCode: 200,
        pageType: 'Product',
        imagesWithoutAlt: 0,
        totalImages: 6,
        extractedLinks: [
          'https://techsaas-nexus.io/',
          'https://techsaas-nexus.io/pricing',
          'https://techsaas-nexus.io/docs/quickstart'
        ]
      },
      {
        url: 'https://techsaas-nexus.io/pricing',
        title: 'Transparent Cloud Observability Pricing | Nexus',
        metaDescription: 'Pay only for the telemetry you ingest. No host taxes, no user seat penalties. Free tier included.',
        canonicalUrl: 'https://techsaas-nexus.io/pricing',
        h1: ['Simple, Predictable Ingestion-Based Pricing'],
        h2: ['Developer Free Tier', 'Scale Tier', 'Custom Enterprise SLA'],
        wordCount: 1200,
        statusCode: 200,
        pageType: 'Product',
        imagesWithoutAlt: 0,
        totalImages: 3,
        extractedLinks: [
          'https://techsaas-nexus.io/',
          'https://techsaas-nexus.io/docs/quickstart'
        ]
      }
    ]
  }
];

// Helper to generate schema JSON-LD based on page type & metadata
export function generateSchema(page: Partial<PageMetadata>, baseUrl: string): Record<string, any> {
  const url = page.url || baseUrl;
  const title = page.title || 'Untitled';
  const description = page.metaDescription || '';

  switch (page.pageType) {
    case 'TechArticle':
      return {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        '@id': `${url}#techarticle`,
        'headline': title,
        'description': description,
        'url': url,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': url
        },
        'author': {
          '@type': 'Organization',
          'name': 'Holistic Growth Marketing Research Lab',
          'url': baseUrl
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Holistic Growth Marketing',
          'url': baseUrl,
          'logo': {
            '@type': 'ImageObject',
            'url': `${baseUrl}/assets/logo.png`
          }
        },
        'datePublished': '2026-01-15T08:00:00+00:00',
        'dateModified': '2026-08-20T14:30:00+00:00',
        'proficiencyLevel': 'Expert',
        'dependencies': 'Python 3.12, BeautifulSoup4, LXML, Next.js',
        'wordCount': page.wordCount || 1800,
        'inLanguage': 'en-US'
      };

    case 'LocalBusiness':
      return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}#localbusiness`,
        'name': title.split('|')[0].trim(),
        'description': description,
        'url': url,
        'telephone': '+1-800-555-GROW',
        'priceRange': '$$$$',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': '100 Growth Boulevard, Suite 500',
          'addressLocality': 'San Francisco',
          'addressRegion': 'CA',
          'postalCode': '94105',
          'addressCountry': 'US'
        },
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': 37.7891,
          'longitude': -122.4014
        },
        'openingHoursSpecification': [
          {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'opens': '09:00',
            'closes': '18:00'
          }
        ]
      };

    case 'Service':
      return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${url}#service`,
        'name': title.split('|')[0].trim(),
        'description': description,
        'url': url,
        'provider': {
          '@type': 'Organization',
          'name': 'Holistic Growth Marketing',
          'url': baseUrl
        },
        'areaServed': {
          '@type': 'Country',
          'name': 'Global'
        },
        'serviceType': 'Technical SEO & Search Intelligence',
        'hasOfferCatalog': {
          '@type': 'OfferCatalog',
          'name': 'SEO Engineering Packages',
          'itemListElement': [
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': 'Enterprise Architecture Audit'
              }
            }
          ]
        }
      };

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'What is the ROI of schema engineering for organic search?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Structured data provides deterministic entity signals to search engine crawlers and LLMs, resulting in rich snippets, knowledge graph placement, and up to 35% higher organic CTR.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How does internal link graph optimization differ from classic silo structures?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Modern link graph algorithms compute dynamic PageRank vectors and topical closeness centrality rather than relying on static hierarchical directories.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can schema and internal links be automated in production CI/CD pipelines?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, using programmatic crawlers with JSON-LD emitters like Site Intelligence Platform, schemas are verified before every deployment.'
            }
          }
        ]
      };

    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${url}#product`,
        'name': title.split('|')[0].trim(),
        'description': description,
        'url': url,
        'brand': {
          '@type': 'Brand',
          'name': 'TechSaaS Nexus'
        },
        'offers': {
          '@type': 'Offer',
          'price': '499.00',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
          'url': url
        }
      };

    case 'AboutPage':
    case 'ContactPage':
    case 'Organization':
    default:
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${baseUrl}#org`,
        'name': 'Holistic Growth Marketing',
        'url': baseUrl,
        'logo': `${baseUrl}/assets/logo.png`,
        'description': description,
        'sameAs': [
          'https://twitter.com/holisticgrowth',
          'https://linkedin.com/company/holisticgrowth',
          'https://github.com/holisticgrowth'
        ],
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+1-800-555-GROW',
          'contactType': 'customer support',
          'availableLanguage': ['English']
        }
      };
  }
}

// SEO Audit engine: checks a page against comprehensive enterprise rules
export function auditPage(page: Partial<PageMetadata>): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Title Checks
  if (!page.title || page.title.trim() === '') {
    issues.push({
      id: `title-missing-${Math.random().toString(36).substring(7)}`,
      type: 'critical',
      code: 'TITLE_MISSING',
      category: 'SEO',
      message: 'Page is missing a <title> tag entirely.',
      recommendation: 'Add a descriptive <title> tag between 50-60 characters including primary target keywords.'
    });
  } else if (page.title.length < 30) {
    issues.push({
      id: `title-short-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'TITLE_TOO_SHORT',
      category: 'SEO',
      message: `Title is too short (${page.title.length} chars). Recommended: 50-60 characters.`,
      recommendation: 'Expand the title to include brand name and primary topic value proposition.'
    });
  } else if (page.title.length > 70) {
    issues.push({
      id: `title-long-${Math.random().toString(36).substring(7)}`,
      type: 'notice',
      code: 'TITLE_TOO_LONG',
      category: 'SEO',
      message: `Title is lengthy (${page.title.length} chars) and may be truncated on Google SERPs.`,
      recommendation: 'Keep primary keyword in first 50 characters to prevent mobile truncation.'
    });
  }

  // Meta Description Checks
  if (!page.metaDescription || page.metaDescription.trim() === '') {
    issues.push({
      id: `desc-missing-${Math.random().toString(36).substring(7)}`,
      type: 'critical',
      code: 'META_DESC_MISSING',
      category: 'SEO',
      message: 'Missing meta description tag.',
      recommendation: 'Craft a compelling meta description (130-160 characters) with a clear Call to Action.'
    });
  } else if (page.metaDescription.length < 60) {
    issues.push({
      id: `desc-short-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'META_DESC_TOO_SHORT',
      category: 'SEO',
      message: `Meta description is under 60 chars (${page.metaDescription.length} chars).`,
      recommendation: 'Provide more context to improve search snippet Click-Through Rate.'
    });
  }

  // H1 Tag Checks
  if (!page.h1 || page.h1.length === 0) {
    issues.push({
      id: `h1-missing-${Math.random().toString(36).substring(7)}`,
      type: 'critical',
      code: 'H1_MISSING',
      category: 'SEO',
      message: 'No <h1> heading found on the page.',
      recommendation: 'Ensure exactly one prominent <h1> tag is present summarizing the main subject.'
    });
  } else if (page.h1.length > 1) {
    issues.push({
      id: `h1-multiple-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'H1_MULTIPLE',
      category: 'SEO',
      message: `Multiple <h1> tags detected (${page.h1.length}).`,
      recommendation: 'Consolidate down to a single H1 per URL and use H2/H3 for hierarchical subheadings.'
    });
  }

  // Canonical Checks
  if (!page.canonicalUrl || page.canonicalUrl.trim() === '') {
    issues.push({
      id: `canonical-missing-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'CANONICAL_MISSING',
      category: 'SEO',
      message: 'No rel="canonical" link found.',
      recommendation: 'Add a self-referencing canonical URL to protect against duplicate URL parameters.'
    });
  }

  // Image Alt Attribute Audits
  if (page.imagesWithoutAlt && page.imagesWithoutAlt > 0) {
    issues.push({
      id: `img-alt-${Math.random().toString(36).substring(7)}`,
      type: 'warning',
      code: 'IMG_ALT_MISSING',
      category: 'Accessibility',
      message: `${page.imagesWithoutAlt} image(s) lack an alt attribute.`,
      recommendation: 'Add descriptive alt text to all visual content for accessibility and image search indexing.'
    });
  }

  // Thin Content Check
  if (page.wordCount && page.wordCount < 500) {
    issues.push({
      id: `thin-content-${Math.random().toString(36).substring(7)}`,
      type: 'notice',
      code: 'THIN_CONTENT',
      category: 'SEO',
      message: `Low body word count (${page.wordCount} words).`,
      recommendation: 'Ensure standard content pages offer comprehensive depth (minimum 600-1000 words).'
    });
  }

  return issues;
}

// Generate real internal link suggestions using tokenized Jaccard similarity, semantic hierarchy, and link-equity deficit analysis
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'from',
  'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'of', 'in', 'on', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can',
  'could', 'should', 'would', 'will', 'this', 'that', 'these', 'those', 'it', 'its'
]);

function extractPageTokens(page: PageMetadata): Set<string> {
  const textCorpus = [
    page.title || '',
    page.metaDescription || '',
    ...(page.h1 || []),
    ...(page.h2 || []),
    page.pageType || ''
  ].join(' ').toLowerCase();

  const words = textCorpus.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
  const filtered = new Set<string>();
  for (const w of words) {
    if (w.length > 3 && !STOP_WORDS.has(w)) {
      filtered.add(w);
    }
  }
  return filtered;
}

export function generateLinkSuggestions(pages: PageMetadata[]): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  if (!pages || pages.length < 2) return suggestions;

  // Pre-extract token sets for each page
  const pageTokens = pages.map(p => ({
    page: p,
    tokens: extractPageTokens(p)
  }));

  // Candidate pair evaluations
  const scoredPairs: {
    source: PageMetadata;
    target: PageMetadata;
    score: number;
    anchor: string;
    reasoning: string;
    cluster: string;
  }[] = [];

  for (let i = 0; i < pageTokens.length; i++) {
    const { page: source, tokens: sourceTokens } = pageTokens[i];

    for (let j = 0; j < pageTokens.length; j++) {
      if (i === j) continue;
      const { page: target, tokens: targetTokens } = pageTokens[j];

      // Check if source already links to target
      const alreadyLinked = source.extractedLinks?.includes(target.url);
      if (alreadyLinked) continue;

      // 1. Calculate Jaccard token overlap
      let intersectionCount = 0;
      sourceTokens.forEach(token => {
        if (targetTokens.has(token)) intersectionCount++;
      });
      const unionSize = new Set([...sourceTokens, ...targetTokens]).size;
      const jaccardSim = unionSize > 0 ? intersectionCount / unionSize : 0;

      // 2. Link Equity & Orphan Deficit: targets with fewer inlinks gain higher priority
      const inlinkCount = target.inlinksCount ?? 0;
      const inlinkDeficitBoost = inlinkCount <= 1 ? 0.25 : inlinkCount <= 3 ? 0.15 : 0.05;

      // 3. Structural taxonomy affinity (e.g. Service <-> FAQ, TechArticle <-> Service)
      let taxonomyBonus = 0;
      let cluster = 'Topical Authority';

      if (source.pageType === 'TechArticle' && target.pageType === 'Service') {
        taxonomyBonus = 0.25;
        cluster = 'Conversion Pathways';
      } else if (source.pageType === 'Service' && target.pageType === 'FAQPage') {
        taxonomyBonus = 0.22;
        cluster = 'User Experience & Trust';
      } else if (source.pageType === 'TechArticle' && target.pageType === 'TechArticle') {
        taxonomyBonus = 0.18;
        cluster = 'Topical Authority';
      } else if (target.pageType === 'LocalBusiness' || target.pageType === 'Organization') {
        taxonomyBonus = 0.12;
        cluster = 'Brand Entity Signals';
      }

      // Compute total real relevance score normalized to 0.00 - 1.00
      const rawScore = (jaccardSim * 1.8) + inlinkDeficitBoost + taxonomyBonus;
      const finalScore = Math.min(0.98, Math.max(0.40, Number(rawScore.toFixed(2))));

      if (finalScore >= 0.65) {
        // Derive contextual anchor from target's actual H1 or title subject
        let anchor = target.h1?.[0] || target.title?.split('|')[0]?.split('–')[0]?.trim() || target.pageType;
        if (anchor.length > 50) {
          anchor = anchor.substring(0, 48).trim() + '...';
        }

        // Shared keyword summary for transparent reasoning
        const sharedKeywords = Array.from(sourceTokens).filter(t => targetTokens.has(t)).slice(0, 3);
        const keywordContext = sharedKeywords.length > 0 ? ` (shared concepts: ${sharedKeywords.join(', ')})` : '';

        const reasoning = inlinkCount <= 1
          ? `High-priority link equity injection: target URL has only ${inlinkCount} inbound links; cross-linking from '${source.title.substring(0, 28)}...' remedies orphan risk${keywordContext}.`
          : `Semantic topic reinforcement: strong contextual affinity between ${source.pageType} and ${target.pageType}${keywordContext}.`;

        scoredPairs.push({
          source,
          target,
          score: finalScore,
          anchor,
          reasoning,
          cluster
        });
      }
    }
  }

  // Sort by highest relevance score and return top results
  scoredPairs.sort((a, b) => b.score - a.score);

  for (let idx = 0; idx < Math.min(scoredPairs.length, 12); idx++) {
    const p = scoredPairs[idx];
    suggestions.push({
      id: `sug-${idx}-${p.source.url.slice(-5)}-${p.target.url.slice(-5)}`,
      sourceUrl: p.source.url,
      targetUrl: p.target.url,
      suggestedAnchor: p.anchor,
      relevanceScore: p.score,
      reasoning: p.reasoning,
      topicCluster: p.cluster
    });
  }

  return suggestions;
}

export function getHolisticGrowthMarketingPages(): PageMetadata[] {
  const preset = SITE_PRESETS[0];
  const baseUrl = preset.baseUrl;
  
  return (preset.pages || []).map((partial) => {
    const page: PageMetadata = {
      url: partial.url || baseUrl,
      title: partial.title || 'Untitled',
      metaDescription: partial.metaDescription || '',
      canonicalUrl: partial.canonicalUrl || partial.url || baseUrl,
      h1: partial.h1 || [],
      h2: partial.h2 || [],
      wordCount: partial.wordCount || 800,
      statusCode: partial.statusCode || 200,
      loadTimeMs: 120 + Math.floor(Math.random() * 80),
      inlinksCount: 3,
      outlinksCount: partial.extractedLinks?.length || 2,
      pageType: (partial.pageType as PageType) || 'WebPage',
      imagesWithoutAlt: partial.imagesWithoutAlt || 0,
      totalImages: partial.totalImages || 3,
      extractedLinks: partial.extractedLinks || [],
      issues: [],
      schemaJson: {},
      schemaValid: true,
      rawHtml: partial.rawHtml || `<!DOCTYPE html><html lang="en"><head><title>${partial.title || 'Page'}</title><meta name="description" content="${partial.metaDescription || ''}"></head><body><h1>${partial.h1?.[0] || 'Heading'}</h1><p>Content for ${partial.url}</p></body></html>`,
      htmlSizeBytes: 14200
    };

    page.schemaJson = generateSchema(page, baseUrl);
    page.issues = auditPage(page);
    return page;
  });
}

