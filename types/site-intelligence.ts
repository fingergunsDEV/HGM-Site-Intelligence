export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';

export interface LogMessage {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  url?: string;
  module?: string;
}

export type PageType = 
  | 'TechArticle'
  | 'LocalBusiness'
  | 'Product'
  | 'FAQPage'
  | 'Service'
  | 'AboutPage'
  | 'ContactPage'
  | 'WebPage'
  | 'Organization'
  | 'CollectionPage';

export interface AuditIssue {
  id: string;
  type: 'critical' | 'warning' | 'notice';
  code: string;
  message: string;
  category: 'SEO' | 'Schema' | 'Performance' | 'Accessibility' | 'Links';
  recommendation: string;
}

export interface LinkEdge {
  source: string;
  target: string;
  anchorText: string;
  isInternal: boolean;
  isNofollow: boolean;
}

export interface AISuggestion {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  suggestedAnchor: string;
  relevanceScore: number;
  reasoning: string;
  topicCluster: string;
}

export interface PageMetadata {
  url: string;
  title: string;
  metaDescription: string;
  canonicalUrl: string;
  h1: string[];
  h2: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  wordCount: number;
  statusCode: number;
  loadTimeMs: number;
  pageType: PageType;
  inlinksCount: number;
  outlinksCount: number;
  schemaValid: boolean;
  schemaJson: Record<string, any>;
  issues: AuditIssue[];
  extractedLinks: string[];
  imagesWithoutAlt: number;
  totalImages: number;
  rawHtml?: string;
  htmlSizeBytes?: number;
  isLiveFetched?: boolean;
  lastFetchedAt?: string;
}

export interface CrawlConfig {
  sitemap: string;
  html_dir?: string;
  output_dir: string;
  base_url: string;
  delay: number;
  concurrency: number;
  cache_dir: string;
  no_fetch: boolean;
  no_cache: boolean;
  // Module toggles
  audit: boolean;
  link_graph: boolean;
  ai_suggest: boolean;
  schema_fix: boolean;
  // Advanced
  max_pages: number;
  user_agent: string;
  url_filter_regex?: string;
  exclude_paths?: string;
  obey_robots: boolean;
  timeout_seconds: number;
}

export interface CrawlSummary {
  taskId: string;
  status: 'idle' | 'running' | 'paused' | 'done' | 'error';
  totalPages: number;
  crawledPages: number;
  percent: number;
  currentUrl?: string;
  startTime?: number;
  endTime?: number;
  elapsedSeconds: number;
  criticalIssuesCount: number;
  warningIssuesCount: number;
  noticeIssuesCount: number;
  totalLinksFound: number;
  schemasGeneratedCount: number;
  aiSuggestionsCount: number;
  avgResponseTimeMs: number;
}

export type SmtpPreset = 'ssl-465' | 'tls-587' | 'custom';

export type AppTabType = 
  | 'dashboard' 
  | 'results' 
  | 'orchestrator'
  | 'cicd'
  | 'payloads'
  | 'codebase' 
  | 'graph' 
  | 'heatmap' 
  | 'ai' 
  | 'architecture'
  | 'fixall'
  | 'smtp'
  | 'logs'
  | 'copilot';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  defaultRecipient: string;
  preset: SmtpPreset;
  autoSendAfterCrawl: boolean;
  alertOnCriticalOnly: boolean;
}

export interface CodebaseItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  content?: string;
  size?: number;
  lastModified?: string;
  parentId?: string | null;
  pageAudit?: PageMetadata;
}

export interface SmtpSendResult {
  success: boolean;
  message: string;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  details?: string;
}

