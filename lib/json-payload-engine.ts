import {
  SearchIntelligencePayload,
  MarketingCampaignPayload,
  SchemaGraphPayload,
  IngestPayloadType
} from '@/types/orchestrator';
import { PageMetadata } from '@/types/site-intelligence';

export interface ValidationResult {
  valid: boolean;
  type: IngestPayloadType | 'unknown';
  errors: string[];
  warnings: string[];
  summary: string;
}

export class JsonPayloadEngine {
  /**
   * Validates raw JSON string against known Search Intelligence & Marketing schemas.
   */
  public validatePayload(rawJson: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!rawJson || rawJson.trim() === '') {
      return {
        valid: false,
        type: 'unknown',
        errors: ['JSON payload is empty.'],
        warnings: [],
        summary: 'Empty input.'
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e: unknown) {
      const err = e as Error;
      return {
        valid: false,
        type: 'unknown',
        errors: [`Syntax error: ${err.message}`],
        warnings: [],
        summary: 'Malformed JSON syntax.'
      };
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        valid: false,
        type: 'unknown',
        errors: ['Top-level JSON payload must be an object with structured schema fields.'],
        warnings: [],
        summary: 'Invalid JSON root object.'
      };
    }

    const obj = parsed as Record<string, unknown>;

    // 1. Check if it's a SearchIntelligencePayload
    if ('site_url' in obj || 'audit_summary' in obj) {
      if (!obj.site_url) errors.push('Missing required property: "site_url"');
      if (!obj.audit_summary || typeof obj.audit_summary !== 'object') {
        errors.push('Missing or invalid property: "audit_summary" (must be an object)');
      } else {
        const summary = obj.audit_summary as Record<string, unknown>;
        if (summary.health_score === undefined) warnings.push('Field "health_score" in audit_summary is missing.');
      }
      return {
        valid: errors.length === 0,
        type: 'search_intelligence_audit',
        errors,
        warnings,
        summary: errors.length === 0 
          ? `Valid Search Intelligence Audit for ${(obj.site_url as string) || 'site'}`
          : 'Invalid Search Intelligence Audit payload.'
      };
    }

    // 2. Check if it's a SchemaGraphPayload
    if (obj['@context'] === 'https://schema.org' || ('context' in obj && obj.context === 'https://schema.org') || '@graph' in obj) {
      const graph = (obj['@graph'] || obj.graph) as unknown[];
      if (!Array.isArray(graph) || graph.length === 0) {
        errors.push('Schema Graph payload must contain a non-empty "@graph" array.');
      }
      return {
        valid: errors.length === 0,
        type: 'schema_graph',
        errors,
        warnings,
        summary: errors.length === 0
          ? `Valid Schema.org Graph with ${graph?.length || 0} entities.`
          : 'Invalid Schema.org Graph payload.'
      };
    }

    // 3. Check if it's a MarketingCampaignPayload
    if ('campaign_name' in obj || 'target_keywords' in obj) {
      if (!obj.campaign_name) errors.push('Missing required field: "campaign_name"');
      if (!obj.base_url) errors.push('Missing required field: "base_url"');
      if (!Array.isArray(obj.target_keywords)) {
        errors.push('Property "target_keywords" must be an array of keyword targets.');
      }
      return {
        valid: errors.length === 0,
        type: 'marketing_campaign',
        errors,
        warnings,
        summary: errors.length === 0
          ? `Valid Marketing Campaign Payload: "${(obj.campaign_name as string) || 'Untitled'}"`
          : 'Invalid Marketing Campaign payload.'
      };
    }

    return {
      valid: false,
      type: 'unknown',
      errors: ['Unrecognized JSON schema. Expected Search Intelligence Audit, Schema Graph, or Marketing Campaign.'],
      warnings: [],
      summary: 'Schema unrecognized.'
    };
  }

  /**
   * Generates sample JSON payloads for different use cases.
   */
  public generateSamplePayload(type: IngestPayloadType): string {
    switch (type) {
      case 'search_intelligence_audit': {
        const payload: SearchIntelligencePayload = {
          version: '2.4.0',
          site_url: 'https://holisticgrowthmarketing.com',
          generated_at: new Date().toISOString(),
          audit_summary: {
            health_score: 92,
            total_urls: 18,
            critical_errors: 2,
            schema_coverage_percent: 88
          },
          target_personas: ['Enterprise SEO Directors', 'Marketing VPs', 'Technical Webmasters'],
          keywords: ['ai search orchestration', 'schema json-ld automation', 'internal link graph optimizer'],
          rankings: [
            {
              keyword: 'enterprise schema crawler',
              position: 3,
              url: 'https://holisticgrowthmarketing.com/features/schema-engine',
              search_volume: 4800,
              competition: 0.62,
              intent: 'commercial',
              ctr_percent: 14.8
            },
            {
              keyword: 'automated html remediation seo',
              position: 5,
              url: 'https://holisticgrowthmarketing.com/solutions/auto-fix',
              search_volume: 2900,
              competition: 0.54,
              intent: 'commercial',
              ctr_percent: 8.2
            },
            {
              keyword: 'internal link equity calculator',
              position: 2,
              url: 'https://holisticgrowthmarketing.com/link-graph',
              search_volume: 6100,
              competition: 0.48,
              intent: 'informational',
              ctr_percent: 21.4
            }
          ]
        };
        return JSON.stringify(payload, null, 2);
      }

      case 'schema_graph': {
        const payload: SchemaGraphPayload = {
          context: 'https://schema.org',
          graph: [
            {
              '@type': 'WebSite',
              '@id': 'https://holisticgrowthmarketing.com/#website',
              url: 'https://holisticgrowthmarketing.com',
              name: 'Holistic Growth Marketing',
              publisher: {
                '@type': 'Organization',
                name: 'Holistic Growth Inc.',
                logo: 'https://holisticgrowthmarketing.com/logo.png'
              }
            },
            {
              '@type': 'LocalBusiness',
              '@id': 'https://holisticgrowthmarketing.com/#localbusiness',
              name: 'Holistic Growth Marketing Agency',
              image: 'https://holisticgrowthmarketing.com/hero.jpg',
              telephone: '+1-555-482-9102',
              priceRange: '$$$$',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '100 Silicon Blvd, Suite 400',
                addressLocality: 'San Francisco',
                addressRegion: 'CA',
                postalCode: '94107',
                addressCountry: 'US'
              }
            },
            {
              '@type': 'FAQPage',
              '@id': 'https://holisticgrowthmarketing.com/faq#faqpage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How does the Autonomous Agentic remediation engine work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The Builder agent teams generate DOM-level fixes and JSON-LD microdata, which are then certified by Validator agents before being staged to CI/CD.'
                  }
                }
              ]
            }
          ]
        };
        return JSON.stringify(payload, null, 2);
      }

      case 'marketing_campaign': {
        const payload: MarketingCampaignPayload = {
          campaign_name: 'Q3 Search Dominance & Technical SEO Expansion',
          target_niche: 'Enterprise B2B SaaS',
          base_url: 'https://holisticgrowthmarketing.com',
          primary_goals: [
            'Capture Top 3 positions for high-intent search intelligence queries',
            'Deploy full Article and FAQPage schema microdata across 100% of landing pages',
            'Eliminate orphan page risk by establishing contextual internal link clusters'
          ],
          target_keywords: [
            { keyword: 'agentic marketing orchestration', difficulty: 58, target_landing_url: '/orchestration' },
            { keyword: 'real-time site audit crawler', difficulty: 64, target_landing_url: '/crawler' },
            { keyword: 'automated json-ld schema fixer', difficulty: 42, target_landing_url: '/schema-fixer' }
          ],
          schema_entities_to_deploy: ['LocalBusiness', 'Article', 'FAQPage', 'BreadcrumbList', 'SoftwareApplication'],
          content_briefs: [
            {
              slug: 'agentic-marketing-guide',
              suggested_title: 'The Definitive Guide to Autonomous Agentic Search Orchestration',
              target_intent: 'informational',
              h2_outline: [
                'What is the Six-Layer Autonomous Cognitive Entity (ACE) Architecture?',
                'Builder and Validator Agent Dynamics for QA',
                'Dual-Bus Telemetry: Northbound and Southbound Protocols',
                'Integrating CI/CD with SuperAdmin Gemini Flash 3.8'
              ],
              schema_type: 'Article'
            }
          ]
        };
        return JSON.stringify(payload, null, 2);
      }

      default:
        return '{}';
    }
  }

  /**
   * Converts an ingested SearchIntelligencePayload into PageMetadata items for the platform.
   */
  public convertPayloadToPages(payload: SearchIntelligencePayload): PageMetadata[] {
    const pages: PageMetadata[] = [];
    const baseUrl = payload.site_url.replace(/\/$/, '');

    // Convert rankings or pages
    if (payload.rankings && payload.rankings.length > 0) {
      payload.rankings.forEach((r, idx) => {
        const url = r.url.startsWith('http') ? r.url : `${baseUrl}${r.url.startsWith('/') ? '' : '/'}${r.url}`;
        pages.push({
          url,
          statusCode: 200,
          loadTimeMs: Math.floor(Math.random() * 120) + 90,
          title: `${r.keyword.charAt(0).toUpperCase() + r.keyword.slice(1)} | Holistic Growth Marketing`,
          metaDescription: `Comprehensive guide and enterprise intelligence platform for ${r.keyword}. Optimize internal link graphs and schema entities.`,
          canonicalUrl: url,
          h1: [`Enterprise ${r.keyword.toUpperCase()} System`],
          h2: ['Platform Capabilities', 'Dual-Bus Architecture', 'Builder & Validator Teams'],
          ogTitle: `${r.keyword} — Site Intelligence`,
          ogDescription: 'Automated search intelligence and agentic marketing orchestration.',
          ogImage: `${baseUrl}/og-image.png`,
          wordCount: 850 + (idx * 120),
          pageType: 'WebPage',
          inlinksCount: 8 + (idx * 2),
          outlinksCount: 5,
          schemaValid: true,
          schemaJson: {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: r.keyword,
            url
          },
          extractedLinks: [`${baseUrl}/`, `${baseUrl}/features`, `${baseUrl}/pricing`],
          imagesWithoutAlt: 0,
          totalImages: 2,
          issues: idx === 1 ? [
            {
              id: 'issue-auto-1',
              type: 'notice',
              code: 'TITLE_KEYWORD_OPTIMIZATION',
              message: 'Title could incorporate secondary high-volume keyword cluster.',
              category: 'SEO',
              recommendation: 'Add high-intent search terms to title tag.'
            }
          ] : [],
          lastFetchedAt: new Date().toISOString()
        });
      });
    }

    return pages;
  }
}

let globalPayloadEngine: JsonPayloadEngine | null = null;

export function getJsonPayloadEngine(): JsonPayloadEngine {
  if (!globalPayloadEngine) {
    globalPayloadEngine = new JsonPayloadEngine();
  }
  return globalPayloadEngine;
}
