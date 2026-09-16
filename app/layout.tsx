import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Site Intelligence Platform — Search Intelligence & Agentic Marketing Orchestration',
  description: 'Enterprise SEO & Schema Crawler, Site Audit, Internal Link Graph, ACE 6-Layer Cognitive Orchestrator, CI/CD Remediation Pipeline, and Gemini 3.8 SuperAdmin Assistant.',
  openGraph: {
    title: 'Site Intelligence Platform — Search Intelligence & Agentic Marketing Orchestration',
    description: 'Enterprise SEO & Schema Crawler, Site Audit, Internal Link Graph, ACE 6-Layer Cognitive Orchestrator, CI/CD Remediation Pipeline, and Gemini 3.8 SuperAdmin Assistant.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Site Intelligence Platform — Search Intelligence & Agentic Marketing Orchestration',
    description: 'Enterprise SEO & Schema Crawler, Site Audit, Internal Link Graph, ACE 6-Layer Cognitive Orchestrator, CI/CD Remediation Pipeline, and Gemini 3.8 SuperAdmin Assistant.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
