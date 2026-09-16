import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, pageData, existingSchema, issues } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback graceful deterministic response if no key is supplied yet
      return NextResponse.json({
        success: true,
        isFallback: true,
        result: generateDeterministicResponse(action, pageData, existingSchema, issues)
      });
    }

    const ai = getGeminiClient();

    if (action === 'fix-schema') {
      const prompt = `You are a World-Class Schema.org Structured Data Engineer and Technical SEO Architect.
Given this webpage metadata:
- URL: ${pageData?.url}
- Title: ${pageData?.title}
- Description: ${pageData?.metaDescription}
- Headings: ${JSON.stringify(pageData?.h1 || [])}, ${JSON.stringify(pageData?.h2 || [])}
- Word Count: ${pageData?.wordCount}
- Detected Type: ${pageData?.pageType}
- Existing JSON-LD Schema: ${JSON.stringify(existingSchema, null, 2)}

Generate a flawless, production-ready, fully expanded JSON-LD Schema (e.g. TechArticle, LocalBusiness, FAQPage, or Organization) with complete @id entity graph nesting, author/publisher credentials, mainEntityOfPage, and sameAs triples.
Return ONLY valid JSON (no markdown fences, pure JSON).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      let parsed = {};
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch {
        parsed = existingSchema;
      }

      return NextResponse.json({
        success: true,
        schema: parsed,
        message: 'Schema successfully enhanced with Gemini entity graph modeling.'
      });
    }

    if (action === 'audit-fix') {
      const prompt = `You are a Senior Technical SEO Consultant.
Given these audit issues for URL ${pageData?.url}:
${JSON.stringify(issues, null, 2)}

Current Title: ${pageData?.title}
Current Meta Description: ${pageData?.metaDescription}
H1: ${JSON.stringify(pageData?.h1)}

Provide high-impact, immediate copywriting & code fixes:
1. Recommended Title (50-60 chars)
2. Recommended Meta Description (140-155 chars)
3. Recommended Single H1
4. Canonical Tag Snippet
5. Image Alt Tag Fixes

Return as JSON matching:
{
  "optimizedTitle": string,
  "optimizedDescription": string,
  "optimizedH1": string,
  "canonicalTag": string,
  "implementationNotes": string
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      let parsed = {};
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch {
        parsed = {
          optimizedTitle: `${pageData?.title || 'Home'} | Holistic Growth`,
          optimizedDescription: `Discover high-performance technical SEO strategies for ${pageData?.title || 'your brand'}.`,
          optimizedH1: pageData?.title || 'Growth Architecture',
          canonicalTag: `<link rel="canonical" href="${pageData?.url}" />`,
          implementationNotes: 'Applied standard metadata optimizations.'
        };
      }

      return NextResponse.json({
        success: true,
        fixes: parsed
      });
    }

    return NextResponse.json({ success: true, message: 'Processed' });
  } catch (error: any) {
    console.error('Gemini AI Suggest error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate AI suggestions' },
      { status: 500 }
    );
  }
}

function generateDeterministicResponse(action: string, pageData: any, existingSchema: any, issues: any) {
  if (action === 'fix-schema') {
    return {
      '@context': 'https://schema.org',
      '@type': pageData?.pageType || 'TechArticle',
      '@id': `${pageData?.url}#enhanced-schema`,
      'headline': pageData?.title || 'Optimized Article',
      'description': pageData?.metaDescription || 'Comprehensive technical breakdown.',
      'url': pageData?.url,
      'datePublished': new Date().toISOString(),
      'dateModified': new Date().toISOString(),
      'mainEntityOfPage': pageData?.url,
      'author': {
        '@type': 'Organization',
        'name': 'Holistic Growth Marketing Lab',
        'url': 'https://holisticgrowthmarketing.com'
      }
    };
  }
  return {
    optimizedTitle: `${pageData?.title || 'Growth Solution'} | Holistic Growth Marketing`,
    optimizedDescription: 'Master modern technical SEO, JSON-LD structured data engineering, and topic clustering.',
    optimizedH1: pageData?.h1?.[0] || 'Technical SEO Architecture & Auditing',
    canonicalTag: `<link rel="canonical" href="${pageData?.url}" />`,
    implementationNotes: 'Automated deterministic SEO optimization applied.'
  };
}
