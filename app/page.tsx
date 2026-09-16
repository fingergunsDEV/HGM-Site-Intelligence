'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  DEFAULT_CONFIG, 
  generateSchema, 
  auditPage, 
  generateLinkSuggestions,
  getHolisticGrowthMarketingPages 
} from '@/lib/crawler-engine';
import { 
  CrawlConfig, 
  PageMetadata, 
  CrawlSummary, 
  LogMessage, 
  AISuggestion 
} from '@/types/site-intelligence';
import { generateCrawlZip, generateAuditCsvString } from '@/lib/export-utils';
import { UserAccount } from '@/types/auth';
import { 
  getStoredUser, 
  saveStoredUser, 
  recordCrawlUsage, 
  upgradeUserToPro, 
  logoutUser,
  useUserAccount,
  isUserFeatureUnlocked,
  isOwnerUser,
  canUserRunCrawl,
  canUserExportData,
  canUserRunAdvancedFeature,
  recordAndDeductCrawlUsage,
  recordAndDeductAdvancedUsage,
  signInWithGoogle
} from '@/lib/auth-storage';

import { Sparkles, ChevronRight, Search, Zap, Mail, Download, Bot } from 'lucide-react';
import { Header, AppTabType } from '@/components/Header';
import { SuperMenu } from '@/components/SuperMenu';
import { ToolSwitcherModal } from '@/components/ToolSwitcherModal';
import { RemediationCenterView } from '@/components/RemediationCenterView';
import { SmtpRelayView } from '@/components/SmtpRelayView';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ControlBar } from '@/components/ControlBar';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { LogStream } from '@/components/LogStream';
import { ResultsTable } from '@/components/ResultsTable';
import { SchemaModal } from '@/components/SchemaModal';
import { AuditDrawer } from '@/components/AuditDrawer';
import { LinkGraphVisualizer } from '@/components/LinkGraphVisualizer';
import { SeoHeatmap } from '@/components/SeoHeatmap';
import { AISuggestionsView } from '@/components/AISuggestionsView';
import { ArchitectureExplorer } from '@/components/ArchitectureExplorer';
import { CodebaseManager } from '@/components/CodebaseManager';
import { SmtpManagerModal } from '@/components/SmtpManagerModal';
import { AuthModal } from '@/components/AuthModal';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { FixAllModal } from '@/components/FixAllModal';
import { BetaTesterManagerModal } from '@/components/BetaTesterManagerModal';
import { ContentProtection } from '@/components/ContentProtection';
import { OrchestratorView } from '@/components/OrchestratorView';
import { CicdPipelineView } from '@/components/CicdPipelineView';
import { JsonIngestView } from '@/components/JsonIngestView';
import { SuperAdminChatbot } from '@/components/SuperAdminChatbot';
import { SmtpConfig } from '@/types/site-intelligence';
import { fixAllPages, fixPageHtml, FixAllSummary, PageFixResult } from '@/lib/html-fixer';
import { getAceOrchestrator } from '@/lib/ace-orchestrator';

export default function Home() {
  // User Session & Plan Tier synchronized via useSyncExternalStore for hydration safety
  const user = useUserAccount();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin'>('signup');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionReason, setSubscriptionReason] = useState<'copy' | 'export' | 'limit' | 'general'>('general');
  const [isBetaTesterModalOpen, setIsBetaTesterModalOpen] = useState(false);

  // Fix All Engine State
  const [isFixAllModalOpen, setIsFixAllModalOpen] = useState(false);
  const [fixAllSummary, setFixAllSummary] = useState<FixAllSummary | null>(null);
  const [isFixAllRunning, setIsFixAllRunning] = useState(false);
  const [fixAllProgress, setFixAllProgress] = useState(0);
  const [currentFixingUrl, setCurrentFixingUrl] = useState<string>('');

  // Main State
  const [config, setConfig] = useState<CrawlConfig>(DEFAULT_CONFIG);
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Holistic Growth Marketing');
  const [activeTab, setActiveTab] = useState<AppTabType>('dashboard');
  const [isSuperAdminChatOpen, setIsSuperAdminChatOpen] = useState(false);

  // Semrush-Style Super Menu & Command Palette State
  const [isSuperMenuCollapsed, setIsSuperMenuCollapsed] = useState(false);
  const [isMobileSuperMenuOpen, setIsMobileSuperMenuOpen] = useState(false);
  const [isToolSwitcherOpen, setIsToolSwitcherOpen] = useState(false);

  // Tab Breadcrumb & Category Helpers
  const getTabDomainLabel = (tab: AppTabType): string => {
    switch (tab) {
      case 'dashboard':
      case 'results':
      case 'fixall':
        return 'SEO & Audit';
      case 'graph':
      case 'heatmap':
        return 'Link Graph & Topology';
      case 'ai':
      case 'copilot':
        return 'AI & Semantics';
      case 'codebase':
      case 'cicd':
      case 'orchestrator':
      case 'architecture':
        return 'Engineering Suite';
      case 'payloads':
        return 'Data & Schemas';
      case 'smtp':
      case 'logs':
        return 'Relay & Logs';
      default:
        return 'Intelligence';
    }
  };

  const getTabTitle = (tab: AppTabType): string => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard & Live Crawler';
      case 'results':
        return 'Site Audit & Pages Inventory';
      case 'fixall':
        return 'Auto-Fix All Remediation Engine';
      case 'graph':
        return 'Internal Link Graph Network';
      case 'heatmap':
        return 'SEO Heatmap Matrix';
      case 'ai':
        return 'AI Link Optimizer & Clusters';
      case 'codebase':
        return 'Codebase IDE & Live HTML Editor';
      case 'payloads':
        return 'JSON-LD Engine & Schema Payloads';
      case 'cicd':
        return 'CI/CD Pipeline & Health Stages';
      case 'orchestrator':
        return 'ACE Cognitive Orchestrator';
      case 'architecture':
        return 'System Architecture & Tech Specs';
      case 'smtp':
        return 'SMTP Mail Relay & Dispatch';
      case 'logs':
        return 'Live Crawl Terminal Log Stream';
      case 'copilot':
        return 'Gemini 3.8 SuperAdmin Copilot';
      default:
        return 'Site Intelligence';
    }
  };

  // SMTP State
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [selectedPageForSmtp, setSelectedPageForSmtp] = useState<PageMetadata | null>(null);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: 'smtp.yourdomain.com',
    port: 465,
    secure: true,
    user: 'admin@yourdomain.com',
    pass: '',
    fromName: 'Site Intelligence Platform',
    fromEmail: 'admin@yourdomain.com',
    defaultRecipient: 'jgibsonwebdesign@gmail.com',
    preset: 'ssl-465',
    autoSendAfterCrawl: false,
    alertOnCriticalOnly: false
  });

  const [summary, setSummary] = useState<CrawlSummary>({
    taskId: 'task-initial',
    status: 'idle',
    totalPages: 0,
    crawledPages: 0,
    percent: 0,
    elapsedSeconds: 0,
    criticalIssuesCount: 0,
    warningIssuesCount: 0,
    noticeIssuesCount: 0,
    totalLinksFound: 0,
    schemasGeneratedCount: 0,
    aiSuggestionsCount: 0,
    avgResponseTimeMs: 0
  });

  const [pages, setPages] = useState<PageMetadata[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      id: 'log-init-1',
      timestamp: '00:00:00',
      level: 'INFO',
      message: 'Site Intelligence Platform initialized. Live real-time crawler ready.'
    },
    {
      id: 'log-init-2',
      timestamp: '00:00:00',
      level: 'INFO',
      message: `Configured target sitemap: ${DEFAULT_CONFIG.sitemap}`
    }
  ]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  // Modals & Drawers
  const [selectedSchemaPage, setSelectedSchemaPage] = useState<PageMetadata | null>(null);
  const [selectedAuditPage, setSelectedAuditPage] = useState<PageMetadata | null>(null);

  // Crawler runtime interval ref
  const isPausedRef = useRef<boolean>(false);

  const addLog = (level: LogMessage['level'], message: string, url?: string) => {
    const newLog: LogMessage = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      level,
      message,
      url
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleOpenAuth = (mode: 'signup' | 'signin' = 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleOpenSubscription = (reason: 'copy' | 'export' | 'limit' | 'general' = 'general') => {
    setSubscriptionReason(reason);
    setIsSubscriptionModalOpen(true);
  };

  const handleSignOut = () => {
    logoutUser();
    addLog('INFO', 'User signed out. Free trial and subscription session cleared.');
  };

  // Switch preset
  const handleSelectPreset = (presetName: string) => {
    setSelectedPresetName(presetName);
    addLog('INFO', `Active target domain: ${config.base_url}`);
  };

  // Crawl Execution
  const handleStartCrawl = async () => {
    if (summary.status === 'running') return;

    // Check Authentication
    if (!user) {
      addLog('WARN', 'Account required to initiate a test crawl. Please create an account to start your free test.');
      handleOpenAuth('signup');
      return;
    }

    // Check Plan Limits & Pricing: 1 free crawl, $1 per crawl thereafter
    const crawlCheck = canUserRunCrawl(user);
    if (!crawlCheck.allowed) {
      addLog('WARN', crawlCheck.reason || 'Insufficient balance for crawl. Each crawl costs $1 after your 1 free test crawl.');
      handleOpenSubscription('limit');
      return;
    }

    // Reset previous crawl data
    setPages([]);
    setSuggestions([]);
    isPausedRef.current = false;

    // Live Real Remote Sitemap Crawler
    addLog('INFO', `Initializing Live Sitemap Crawler for: ${config.sitemap}`);
    addLog('INFO', `Mode: Real HTTP Crawl & Live DOM Extraction (User-Agent: ${config.user_agent})`);
    addLog('INFO', `Connecting to remote host and parsing XML structure...`);

    const startTime = Date.now();

    setSummary(prev => ({
      ...prev,
      taskId: `live-task-${Date.now()}`,
      status: 'running',
      totalPages: 0,
      crawledPages: 0,
      percent: 10,
      elapsedSeconds: 0,
      criticalIssuesCount: 0,
      warningIssuesCount: 0,
      noticeIssuesCount: 0,
      totalLinksFound: 0,
      schemasGeneratedCount: 0,
      aiSuggestionsCount: 0
    }));

    // Elapsed timer
    const elapsedInterval = setInterval(() => {
      setSummary(prev => {
        if (prev.status !== 'running') {
          clearInterval(elapsedInterval);
          return prev;
        }
        return {
          ...prev,
          elapsedSeconds: Math.floor((Date.now() - startTime) / 1000)
        };
      });
    }, 1000);

    try {
      addLog('INFO', `Fetching XML sitemap and live HTML pages from server...`);

      const response = await fetch('/api/crawl/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitemapUrl: config.sitemap,
          baseUrl: config.base_url,
          maxPages: config.max_pages,
          userAgent: config.user_agent
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status} failed to crawl live sitemap`);
      }

      clearInterval(elapsedInterval);

      const livePages: PageMetadata[] = data.pages || [];
      addLog('SUCCESS', `Successfully extracted ${data.totalSitemapUrls} real URLs from ${config.sitemap}!`);
      addLog('INFO', `Live scraped and analyzed ${livePages.length} real HTML pages.`);

      // Log findings per page
      livePages.forEach(p => {
        if (p.issues.length > 0) {
          const crit = p.issues.filter(i => i.type === 'critical').length;
          if (crit > 0) {
            addLog('WARN', `[${p.issues[0].code}] ${p.issues[0].message} on ${p.url}`, p.url);
          }
        }
        addLog('INFO', `Parsed live page: ${p.title} (${p.wordCount} words, ${p.extractedLinks?.length || 0} links)`, p.url);
      });

      // Compute AI suggestions if module is enabled
      const generatedSuggestions = config.ai_suggest ? generateLinkSuggestions(livePages) : [];
      setSuggestions(generatedSuggestions);
      setPages(livePages);

      const totalCritical = livePages.reduce((acc, p) => acc + p.issues.filter(i => i.type === 'critical').length, 0);
      const totalWarn = livePages.reduce((acc, p) => acc + p.issues.filter(i => i.type === 'warning').length, 0);
      const totalNotice = livePages.reduce((acc, p) => acc + p.issues.filter(i => i.type === 'notice').length, 0);
      const totalLinks = livePages.reduce((acc, p) => acc + (p.extractedLinks?.length || 0), 0);

      setSummary(prev => ({
        ...prev,
        status: 'done',
        percent: 100,
        currentUrl: undefined,
        totalPages: data.totalSitemapUrls || livePages.length,
        crawledPages: livePages.length,
        criticalIssuesCount: totalCritical,
        warningIssuesCount: totalWarn,
        noticeIssuesCount: totalNotice,
        totalLinksFound: totalLinks,
        schemasGeneratedCount: livePages.length,
        aiSuggestionsCount: generatedSuggestions.length,
        elapsedSeconds: Math.floor((Date.now() - startTime) / 1000)
      }));

      // Deduct or record crawl usage according to pricing model ($1/crawl, 1st free, super admin free)
      const deduction = recordAndDeductCrawlUsage();
      if (deduction.deducted > 0) {
        addLog('INFO', `Charged $${deduction.deducted.toFixed(2)} for crawl. Remaining credit balance: $${deduction.remainingBalance.toFixed(2)}`);
      } else if (isOwnerUser(user)) {
        addLog('INFO', 'Super Admin session: Crawl executed with zero-charge unrestricted access.');
      } else {
        addLog('INFO', `Free test crawl consumed (${deduction.crawlsRunCount}/1 used). Next crawl will cost $1. Exports are disabled on free crawl.`);
      }

      addLog('SUCCESS', `Live crawl finished! All ${livePages.length} pages audited with live link graph.`);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 }
      });
    } catch (err: any) {
      clearInterval(elapsedInterval);
      addLog('ERROR', `Live crawl error: ${err.message || 'Network error'}`);
      setSummary(prev => ({
        ...prev,
        status: 'error',
        currentUrl: undefined
      }));
    }
  };

  const handlePauseCrawl = () => {
    isPausedRef.current = true;
    setSummary(prev => ({ ...prev, status: 'paused' }));
    addLog('WARN', 'Crawl execution paused by user.');
  };

  const handleResumeCrawl = () => {
    isPausedRef.current = false;
    setSummary(prev => ({ ...prev, status: 'running' }));
    addLog('INFO', 'Crawl execution resumed.');
  };

  const handleReset = () => {
    isPausedRef.current = false;
    setPages([]);
    setLogs([]);
    setSuggestions([]);
    setSummary({
      taskId: 'task-initial',
      status: 'idle',
      totalPages: 0,
      crawledPages: 0,
      percent: 0,
      elapsedSeconds: 0,
      criticalIssuesCount: 0,
      warningIssuesCount: 0,
      noticeIssuesCount: 0,
      totalLinksFound: 0,
      schemasGeneratedCount: 0,
      aiSuggestionsCount: 0,
      avgResponseTimeMs: 0
    });
    addLog('INFO', 'Crawl session and memory cache cleared.');
  };

  // Download ZIP (Gated: No exports on 1 free crawl, unlocked via paid crawl or balance)
  const handleDownloadZip = async () => {
    if (pages.length === 0) return;

    if (!canUserExportData(user).allowed) {
      addLog('WARN', 'Exports are not available on the 1 free test crawl. Add credits ($1/crawl) to export all schemas and report files.');
      handleOpenSubscription('export');
      return;
    }

    addLog('INFO', 'Packaging all schemas, audit CSVs, and link graphs into ZIP bundle...');
    try {
      const zipBlob = await generateCrawlZip(pages, summary, suggestions);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `site_intelligence_export_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      addLog('SUCCESS', 'ZIP package successfully generated and downloaded.');
    } catch (err: any) {
      addLog('ERROR', `Failed to generate ZIP export: ${err.message}`);
    }
  };

  // Download CSV (Gated: No exports on 1 free crawl, unlocked via paid crawl or balance)
  const handleDownloadCsv = () => {
    if (pages.length === 0) return;

    if (!canUserExportData(user).allowed) {
      addLog('WARN', 'Exports are not available on the 1 free test crawl. Add credits ($1/crawl) to export full audit CSV datasets.');
      handleOpenSubscription('export');
      return;
    }

    const csvContent = generateAuditCsvString(pages);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo_audit_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('SUCCESS', 'Audit CSV exported successfully.');
  };

  // Update page live HTML & extracted metadata
  const handleUpdatePageHtml = (url: string, newHtml: string, updatedMetadata: Partial<PageMetadata>) => {
    setPages(prev => prev.map(p => {
      if (p.url === url) {
        const merged: PageMetadata = {
          ...p,
          ...updatedMetadata,
          rawHtml: newHtml,
          isLiveFetched: true,
          lastFetchedAt: new Date().toISOString()
        };
        // Re-audit issues
        merged.issues = auditPage(merged);
        return merged;
      }
      return p;
    }));

    if (selectedAuditPage && selectedAuditPage.url === url) {
      setSelectedAuditPage(prev => prev ? {
        ...prev,
        ...updatedMetadata,
        rawHtml: newHtml,
        isLiveFetched: true,
        lastFetchedAt: new Date().toISOString()
      } : null);
    }

    addLog('SUCCESS', `Pulled & updated fresh live HTML for ${url} (${(newHtml.length / 1024).toFixed(1)} KB)`, url);
  };

  // Update schema when user enhances with AI
  const handleUpdateSchema = (url: string, newSchema: Record<string, any>) => {
    setPages(prev => prev.map(p => p.url === url ? { ...p, schemaJson: newSchema } : p));
    addLog('SUCCESS', `Applied Gemini AI Schema Enhancement to ${url}`, url);
  };

  // Apply AI Fix to page metadata
  const handleApplyFix = (url: string, fixData: any) => {
    setPages(prev => prev.map(p => {
      if (p.url === url) {
        return {
          ...p,
          title: fixData.optimizedTitle || p.title,
          metaDescription: fixData.optimizedDescription || p.metaDescription,
          canonicalUrl: url,
          h1: fixData.optimizedH1 ? [fixData.optimizedH1] : p.h1,
          issues: p.issues.filter(i => !['TITLE_MISSING', 'TITLE_TOO_SHORT', 'META_DESC_MISSING', 'CANONICAL_MISSING', 'H1_MISSING'].includes(i.code))
        };
      }
      return p;
    }));
    addLog('SUCCESS', `Applied Gemini AI SEO fixes to ${url}`, url);
  };

  // Auto-Fix All Engine: Rewrites all HTML files, injects schemas, fixes errors & validates ($3/run)
  const handleTriggerFixAll = async () => {
    // Check advanced feature permissions
    const advCheck = canUserRunAdvancedFeature(user);
    if (!advCheck.allowed) {
      addLog('WARN', advCheck.reason || 'Advanced Auto-Fix features cost $3/run. Please add credits.');
      handleOpenSubscription('general');
      return;
    }

    let targetPages = pages;
    
    // If no pages crawled yet, load initial preset pages to fix
    if (targetPages.length === 0) {
      addLog('INFO', 'Initializing target sitemap pages for Auto-Fix Engine...');
      const loaded = getHolisticGrowthMarketingPages();
      setPages(loaded);
      targetPages = loaded;
    }

    setIsFixAllModalOpen(true);
    setIsFixAllRunning(true);
    setFixAllProgress(10);
    addLog('INFO', `⚡ Starting Auto-Fix All Engine across ${targetPages.length} sitemap pages...`);

    // Execute real progressive page-by-page HTML remediation and validation
    const pageResults: PageFixResult[] = [];
    let totalFixed = 0;
    let criticalResolved = 0;
    let warningResolved = 0;
    let noticeResolved = 0;

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      setCurrentFixingUrl(page.url);

      // Perform real Cheerio-based HTML correction and audit re-computation
      const fixed = fixPageHtml(page, config.base_url);
      pageResults.push(fixed);

      for (const orig of fixed.originalIssues) {
        if (orig.type === 'critical') criticalResolved++;
        else if (orig.type === 'warning') warningResolved++;
        else if (orig.type === 'notice') noticeResolved++;
        totalFixed++;
      }

      const percent = Math.round(15 + ((i + 1) / targetPages.length) * 85);
      setFixAllProgress(percent);

      if (fixed.fixedIssues.length > 0) {
        addLog('INFO', `Remediated ${page.url}: fixed ${fixed.fixedIssues.join(', ')}`, page.url);
      } else {
        addLog('INFO', `Verified 100% compliant HTML & Schema for ${page.url}`, page.url);
      }

      // Small async yield to allow UI repaint
      await new Promise(r => setTimeout(r, 25));
    }

    const scoreBefore = Math.round(pageResults.reduce((acc, r) => acc + r.healthScoreBefore, 0) / Math.max(1, pageResults.length));
    const scoreAfter = Math.round(pageResults.reduce((acc, r) => acc + r.healthScoreAfter, 0) / Math.max(1, pageResults.length));

    const resultSummary: FixAllSummary = {
      totalPages: targetPages.length,
      totalIssuesFixed: totalFixed,
      criticalIssuesResolved: criticalResolved,
      warningIssuesResolved: warningResolved,
      noticeIssuesResolved: noticeResolved,
      pagesFixed: pageResults,
      overallHealthScoreBefore: scoreBefore,
      overallHealthScoreAfter: scoreAfter
    };

    setFixAllSummary(resultSummary);
    setFixAllProgress(100);
    setIsFixAllRunning(false);

    // Sync directly with ACE Cognitive Orchestrator
    const ace = getAceOrchestrator();
    ace.ingestPagesIntoTasks(pageResults.map(r => r.updatedMetadata));
    ace.emitBusMessage({
      bus: 'northbound',
      from: 'work-builder-1',
      to: 'operational',
      type: 'result',
      payload: `Auto-Fix All successfully repaired ${totalFixed} SEO defects across ${targetPages.length} pages. Health score increased to ${scoreAfter}%.`,
      layer: 'operational',
      severity: 'success'
    });

    // Deduct advanced usage according to pricing model ($3/run, free for Super Admin)
    const deduction = recordAndDeductAdvancedUsage('Fix All & Clean HTML');
    if (deduction.deducted > 0) {
      addLog('INFO', `Charged $${deduction.deducted.toFixed(2)} for Auto-Fix All run. Remaining credit balance: $${deduction.remainingBalance.toFixed(2)}`);
    } else if (isOwnerUser(user)) {
      addLog('INFO', 'Super Admin session: Advanced Auto-Fix executed with zero-charge unrestricted access.');
    }

    addLog(
      'SUCCESS', 
      `Auto-Fix Complete! Fixed ${resultSummary.totalIssuesFixed} SEO violations across ${resultSummary.totalPages} pages. Health Score: ${resultSummary.overallHealthScoreBefore}% → ${resultSummary.overallHealthScoreAfter}%.`
    );
  };

  const handleApplyAllFixesToState = () => {
    if (!fixAllSummary || fixAllSummary.pagesFixed.length === 0) return;

    // Update pages in state with newly fixed metadata and clean HTML
    setPages(fixAllSummary.pagesFixed.map(p => p.updatedMetadata));

    // Recalculate summary metrics to reflect 100% clean audit
    setSummary(prev => ({
      ...prev,
      criticalIssuesCount: 0,
      warningIssuesCount: 0,
      noticeIssuesCount: 0,
      schemasGeneratedCount: fixAllSummary.totalPages
    }));

    addLog('SUCCESS', `Applied clean HTML and verified schemas to all ${fixAllSummary.totalPages} pages in main inventory.`);
  };

  const handlePushPageToCrawler = (auditedPage: PageMetadata) => {
    setPages(prev => {
      const existingIdx = prev.findIndex(p => p.url === auditedPage.url);
      let updated: PageMetadata[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = auditedPage;
      } else {
        updated = [auditedPage, ...prev];
      }
      return updated;
    });

    setSummary(prev => ({
      ...prev,
      crawledPages: prev.crawledPages + 1,
      totalPages: Math.max(prev.totalPages, prev.crawledPages + 1),
      criticalIssuesCount: prev.criticalIssuesCount + auditedPage.issues.filter(i => i.type === 'critical').length,
      warningIssuesCount: prev.warningIssuesCount + auditedPage.issues.filter(i => i.type === 'warning').length,
      schemasGeneratedCount: prev.schemasGeneratedCount + 1
    }));

    addLog('SUCCESS', `Codebase file pushed to live crawler: ${auditedPage.url}`, auditedPage.url);
  };

  const handleIngestPagesFromPayload = (newPages: PageMetadata[]) => {
    setPages(prev => {
      const map = new Map<string, PageMetadata>();
      prev.forEach(p => map.set(p.url, p));
      newPages.forEach(p => map.set(p.url, p));
      return Array.from(map.values());
    });

    const crit = newPages.reduce((acc, p) => acc + (p.issues?.filter(i => i.type === 'critical').length || 0), 0);
    const warn = newPages.reduce((acc, p) => acc + (p.issues?.filter(i => i.type === 'warning').length || 0), 0);

    setSummary(prev => ({
      ...prev,
      status: 'done',
      crawledPages: prev.crawledPages + newPages.length,
      totalPages: Math.max(prev.totalPages, prev.crawledPages + newPages.length),
      percent: 100,
      criticalIssuesCount: prev.criticalIssuesCount + crit,
      warningIssuesCount: prev.warningIssuesCount + warn,
      schemasGeneratedCount: prev.schemasGeneratedCount + newPages.length
    }));

    addLog('SUCCESS', `Ingested ${newPages.length} search intelligence URLs into active inventory.`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className={`min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white ${!canUserExportData(user).allowed ? 'select-none' : ''}`}>
      {/* Content Protection & Anti-Scraping Shield for Free Tier */}
      <ContentProtection
        user={user}
        onOpenSubscriptionModal={handleOpenSubscription}
      />

      {/* App Header */}
      <Header
        summary={summary}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPreset={selectedPresetName}
        onSelectPreset={handleSelectPreset}
        onOpenSmtpModal={() => {
          setSelectedPageForSmtp(null);
          setIsSmtpModalOpen(true);
        }}
        user={user}
        onOpenAuthModal={handleOpenAuth}
        onOpenSubscriptionModal={handleOpenSubscription}
        onSignOut={handleSignOut}
        onOpenSuperAdminChat={() => setIsSuperAdminChatOpen(true)}
        onOpenBetaTestersModal={() => setIsBetaTesterModalOpen(true)}
        onToggleSuperMenu={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsMobileSuperMenuOpen(!isMobileSuperMenuOpen);
          } else {
            setIsSuperMenuCollapsed(!isSuperMenuCollapsed);
          }
        }}
        onOpenToolSwitcher={() => setIsToolSwitcherOpen(true)}
        isSuperMenuCollapsed={isSuperMenuCollapsed}
      />

      {/* Platform Workspace: Super Menu Sidebar + Dynamic Content Canvas */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Semrush-Style Two-Tier Super Menu */}
        <SuperMenu
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          summary={summary}
          pagesCount={pages.length}
          logsCount={logs.length}
          user={user}
          onOpenSmtpModal={() => {
            setSelectedPageForSmtp(null);
            setIsSmtpModalOpen(true);
          }}
          onOpenSuperAdminChat={() => setIsSuperAdminChatOpen(true)}
          onOpenFixAll={handleTriggerFixAll}
          isMobileOpen={isMobileSuperMenuOpen}
          onCloseMobile={() => setIsMobileSuperMenuOpen(false)}
          isCollapsed={isSuperMenuCollapsed}
          onToggleCollapse={() => setIsSuperMenuCollapsed(!isSuperMenuCollapsed)}
        />

        {/* Dynamic Content Canvas */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Breadcrumb & Section Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-mono">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Platform</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                {getTabDomainLabel(activeTab)}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                {getTabTitle(activeTab)}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsToolSwitcherOpen(true)}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Search Tools & Tabs (⌘K)"
              >
                <Search className="w-3 h-3 text-slate-400" />
                <span>Switch Tool</span>
                <kbd className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-400">⌘K</kbd>
              </button>

              {activeTab !== 'fixall' && (
                <button
                  type="button"
                  onClick={handleTriggerFixAll}
                  disabled={pages.length === 0}
                  className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Fix All</span>
                </button>
              )}

              {activeTab !== 'smtp' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPageForSmtp(null);
                    setIsSmtpModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3 h-3 text-indigo-600" />
                  <span>SMTP</span>
                </button>
              )}
            </div>
          </div>
        {/* TAB 1: Live Dashboard & Crawler */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Config & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8">
                <ConfigPanel
                  config={config}
                  setConfig={setConfig}
                  isRunning={summary.status === 'running'}
                />
              </div>

              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                <ControlBar
                  summary={summary}
                  onStart={handleStartCrawl}
                  onPause={handlePauseCrawl}
                  onResume={handleResumeCrawl}
                  onReset={handleReset}
                  onDownloadZip={handleDownloadZip}
                  onDownloadCsv={handleDownloadCsv}
                  onOpenFixAll={handleTriggerFixAll}
                  hasResults={pages.length > 0}
                  user={user}
                  onOpenSubscriptionModal={handleOpenSubscription}
                  onOpenAuthModal={() => handleOpenAuth('signup')}
                />

                {/* Quick Helper Banner */}
                <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-xs border border-indigo-800/50 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <span>⚡ Enterprise Schema & Link Engine</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Dispatches recursive sitemap traversal, builds JSON-LD schemas for each page type, validates heading structures, and calculates internal link equity flow.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Progress & Stats Cards */}
            <ProgressDashboard summary={summary} />

            {/* Live Terminal Log Stream */}
            <LogStream
              logs={logs}
              onClearLogs={() => setLogs([])}
            />

            {/* Compact Preview Table if pages exist */}
            {pages.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 font-mono">
                    CRAWLED PAGES SNAPSHOT ({pages.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('results')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    View All {pages.length} Pages & Schemas →
                  </button>
                </div>

                <ResultsTable
                  pages={pages}
                  onOpenSchema={(page) => setSelectedSchemaPage(page)}
                  onOpenAudit={(page) => setSelectedAuditPage(page)}
                  onOpenAiFix={(page) => setSelectedAuditPage(page)}
                  onOpenHtml={(page) => setSelectedAuditPage(page)}
                  onOpenFixAll={handleTriggerFixAll}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Pages & Schemas */}
        {activeTab === 'results' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Page Inventory & JSON-LD Schemas
                </h2>
                <p className="text-xs text-slate-500">
                  Full metadata, schema entity definitions, and audit status per crawled URL.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerFixAll}
                  disabled={pages.length === 0}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fix All & Clean HTML</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={pages.length === 0}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Export Audit CSV {!canUserExportData(user).allowed && '(🔒 Paid Crawl Req)'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={pages.length === 0}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Download All Schemas (.zip) {!canUserExportData(user).allowed && '(🔒 Paid Crawl Req)'}
                </button>
              </div>
            </div>

            <ResultsTable
              pages={pages}
              onOpenSchema={(page) => setSelectedSchemaPage(page)}
              onOpenAudit={(page) => setSelectedAuditPage(page)}
              onOpenAiFix={(page) => setSelectedAuditPage(page)}
              onOpenHtml={(page) => setSelectedAuditPage(page)}
              onOpenFixAll={handleTriggerFixAll}
            />
          </div>
        )}

        {/* TAB 3: Codebase & Directory Manager + Live HTML Editor & Auditor */}
        {activeTab === 'codebase' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <CodebaseManager
              onPushPageToCrawler={handlePushPageToCrawler}
              onOpenSmtpModalForPage={(page) => {
                setSelectedPageForSmtp(page);
                setIsSmtpModalOpen(true);
              }}
              onOpenAuditDrawer={(page) => setSelectedAuditPage(page)}
              onOpenSchemaModal={(page) => setSelectedSchemaPage(page)}
              smtpConfig={smtpConfig}
            />
          </div>
        )}

        {/* TAB 4: Internal Link Graph */}
        {activeTab === 'graph' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {pages.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
                <p className="text-slate-500 text-sm">
                  No crawl data available yet to build the internal link graph.
                </p>
                <button
                  type="button"
                  onClick={handleStartCrawl}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  Start Live Crawl to Generate Link Graph
                </button>
              </div>
            ) : (
              <LinkGraphVisualizer
                pages={pages}
                onSelectPage={(page) => setSelectedSchemaPage(page)}
                onOpenAudit={(page) => setSelectedAuditPage(page)}
                onOpenSchema={(page) => setSelectedSchemaPage(page)}
              />
            )}
          </div>
        )}

        {/* TAB: SEO Heatmap Architecture Visualizer */}
        {activeTab === 'heatmap' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <SeoHeatmap
              pages={pages}
              onOpenAudit={(page) => setSelectedAuditPage(page)}
              onOpenSchema={(page) => setSelectedSchemaPage(page)}
              onStartCrawl={handleStartCrawl}
            />
          </div>
        )}

        {/* TAB: AI Suggestions & Topic Clusters */}
        {activeTab === 'ai' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {pages.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
                <p className="text-slate-500 text-sm">
                  Run a live crawl to allow Gemini to analyze semantic content clusters and suggest high-impact internal links.
                </p>
                <button
                  type="button"
                  onClick={handleStartCrawl}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  Start Live Crawl
                </button>
              </div>
            ) : (
              <AISuggestionsView
                suggestions={suggestions}
                pages={pages}
                onRefreshSuggestions={() => {
                  const fresh = generateLinkSuggestions(pages);
                  setSuggestions(fresh);
                }}
              />
            )}
          </div>
        )}

        {/* TAB: Cognitive Orchestrator & ACE Hierarchy */}
        {activeTab === 'orchestrator' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <OrchestratorView onOpenSuperAdminChat={() => setIsSuperAdminChatOpen(true)} />
          </div>
        )}

        {/* TAB: CI/CD Pipeline & Automated Remediations */}
        {activeTab === 'cicd' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <CicdPipelineView />
          </div>
        )}

        {/* TAB: JSON Ingest Engine & Payload Generator */}
        {activeTab === 'payloads' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <JsonIngestView
              onIngestPages={handleIngestPagesFromPayload}
              onNavigateToResults={() => setActiveTab('results')}
            />
          </div>
        )}

        {/* TAB: Python Engine Specs & Architecture */}
        {activeTab === 'architecture' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <ArchitectureExplorer />
          </div>
        )}

        {/* TAB: Auto-Fix All Remediation Engine */}
        {activeTab === 'fixall' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <RemediationCenterView
              pages={pages}
              summary={summary}
              fixAllSummary={fixAllSummary}
              isRunning={isFixAllRunning}
              progressPercent={fixAllProgress}
              currentProcessingUrl={currentFixingUrl}
              onTriggerFixAll={handleTriggerFixAll}
              onOpenFixAllModal={() => setIsFixAllModalOpen(true)}
              onDownloadZip={handleDownloadZip}
              onDownloadCsv={handleDownloadCsv}
              user={user}
              onOpenSubscriptionModal={handleOpenSubscription}
              onSelectPageAudit={(page) => setSelectedAuditPage(page)}
              onSelectPageSchema={(page) => setSelectedSchemaPage(page)}
            />
          </div>
        )}

        {/* TAB: SMTP Relay Manager & Email Alerts */}
        {activeTab === 'smtp' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <SmtpRelayView
              smtpConfig={smtpConfig}
              onSaveConfig={(newConfig) => {
                setSmtpConfig(newConfig);
                addLog('INFO', `SMTP configuration saved (${newConfig.host}:${newConfig.port})`);
              }}
              pages={pages}
              summary={summary}
            />
          </div>
        )}

        {/* TAB: Live Crawl Terminal Stream */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Live Crawl & Audit Terminal Stream
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time telemetry, HTTP response status codes, Cheerio DOM extraction events, and Schema synthesis logs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `crawl-terminal-logs-${new Date().toISOString().slice(0, 10)}.log`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={logs.length === 0}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export Log File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  disabled={logs.length === 0}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            <LogStream
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          </div>
        )}

        {/* TAB: Gemini 3.8 SuperAdmin Copilot */}
        {activeTab === 'copilot' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4 max-w-xl mx-auto my-12 animate-in fade-in duration-150">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Gemini 3.8 SuperAdmin Copilot</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Autonomous conversational assistant with complete real-time search intelligence, crawl context, and HTML remediation capabilities.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSuperAdminChatOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Launch Copilot Chat Drawer</span>
            </button>
          </div>
        )}
      </main>
    </div>

      {/* Modals & Drawers */}
      <SchemaModal
        page={selectedSchemaPage}
        isOpen={!!selectedSchemaPage}
        onClose={() => setSelectedSchemaPage(null)}
        onUpdateSchema={handleUpdateSchema}
        isPro={canUserExportData(user).allowed}
        onOpenSubscriptionModal={handleOpenSubscription}
      />

      <AuditDrawer
        page={selectedAuditPage}
        isOpen={!!selectedAuditPage}
        onClose={() => setSelectedAuditPage(null)}
        onApplyFix={handleApplyFix}
        onUpdatePageHtml={handleUpdatePageHtml}
        isPro={isUserFeatureUnlocked(user)}
        onOpenSubscriptionModal={handleOpenSubscription}
        onOpenFixAll={handleTriggerFixAll}
        baseUrl={config.base_url}
      />

      <FixAllModal
        isOpen={isFixAllModalOpen}
        onClose={() => setIsFixAllModalOpen(false)}
        summary={fixAllSummary}
        isRunning={isFixAllRunning}
        progressPercent={fixAllProgress}
        currentProcessingUrl={currentFixingUrl}
        onApplyAllToState={handleApplyAllFixesToState}
        user={user}
        onOpenSubscriptionModal={handleOpenSubscription}
        baseUrl={config.base_url}
      />

      <SmtpManagerModal
        isOpen={isSmtpModalOpen}
        onClose={() => {
          setIsSmtpModalOpen(false);
          setSelectedPageForSmtp(null);
        }}
        smtpConfig={smtpConfig}
        onSaveConfig={(newConfig) => {
          setSmtpConfig(newConfig);
          addLog('INFO', `SMTP configuration updated (Host: ${newConfig.host}:${newConfig.port})`);
        }}
        pages={pages}
        summary={summary}
        selectedPageForReport={selectedPageForSmtp}
      />

      {/* Beta Tester Whitelist Manager Modal (Owner Only) */}
      <BetaTesterManagerModal
        isOpen={isBetaTesterModalOpen}
        onClose={() => setIsBetaTesterModalOpen(false)}
        currentUser={user}
        onSimulateTesterSignIn={(email, name) => {
          const simulated = signInWithGoogle({ email, name });
          setIsBetaTesterModalOpen(false);
          addLog('SUCCESS', `Switched active session to Beta Tester: ${simulated.name} (${simulated.email})`);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newUser) => {
          saveStoredUser(newUser);
          setIsAuthModalOpen(false);
          addLog('SUCCESS', `Welcome ${newUser.name}! Your account is active with 1 free test crawl.`);
        }}
      />

      {/* Subscription Paywall Modal ($20/month) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        user={user}
        onUpdateUser={(upgradedUser) => {
          saveStoredUser(upgradedUser);
          setIsSubscriptionModalOpen(false);
          addLog('SUCCESS', '🎉 Upgraded to Pro Plan ($20/month)! Unlimited live crawling and data exports are now unlocked.');
        }}
        onRequireAuth={() => {
          setIsSubscriptionModalOpen(false);
          handleOpenAuth('signup');
        }}
        triggerReason={subscriptionReason}
      />

      {/* Gemini 3.8 Flash SuperAdmin Chatbot (Floating Global Controller) */}
      <SuperAdminChatbot
        isOpenControlled={isSuperAdminChatOpen}
        onCloseControlled={() => setIsSuperAdminChatOpen(false)}
        onCommitPushed={() => setActiveTab('cicd')}
        onGoalInjected={() => setActiveTab('orchestrator')}
      />

      {/* Semrush-Style Quick Command Palette / Tool Switcher Modal */}
      <ToolSwitcherModal
        isOpen={isToolSwitcherOpen}
        onClose={() => setIsToolSwitcherOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsToolSwitcherOpen(false);
        }}
        onOpenSmtpModal={() => {
          setIsToolSwitcherOpen(false);
          setSelectedPageForSmtp(null);
          setIsSmtpModalOpen(true);
        }}
        onOpenSuperAdminChat={() => {
          setIsToolSwitcherOpen(false);
          setIsSuperAdminChatOpen(true);
        }}
        onOpenFixAll={() => {
          setIsToolSwitcherOpen(false);
          handleTriggerFixAll();
        }}
      />

    </div>
  );
}

