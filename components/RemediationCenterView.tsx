'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileCode2, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Code2, 
  Eye, 
  ExternalLink,
  ChevronRight,
  Zap,
  ArrowRight
} from 'lucide-react';
import { PageMetadata, CrawlSummary } from '@/types/site-intelligence';
import { UserAccount } from '@/types/auth';
import { FixAllSummary, PageFixResult } from '@/lib/html-fixer';
import { isUserFeatureUnlocked } from '@/lib/auth-storage';

interface RemediationCenterViewProps {
  pages: PageMetadata[];
  summary: CrawlSummary;
  fixAllSummary: FixAllSummary | null;
  isRunning: boolean;
  progressPercent: number;
  currentProcessingUrl?: string;
  onTriggerFixAll: () => void;
  onOpenFixAllModal: () => void;
  onDownloadZip: () => void;
  onDownloadCsv: () => void;
  user: UserAccount | null;
  onOpenSubscriptionModal: (reason: 'export' | 'copy' | 'limit' | 'general') => void;
  onSelectPageAudit: (page: PageMetadata) => void;
  onSelectPageSchema: (page: PageMetadata) => void;
}

export function RemediationCenterView({
  pages,
  summary,
  fixAllSummary,
  isRunning,
  progressPercent,
  currentProcessingUrl,
  onTriggerFixAll,
  onOpenFixAllModal,
  onDownloadZip,
  onDownloadCsv,
  user,
  onOpenSubscriptionModal,
  onSelectPageAudit,
  onSelectPageSchema
}: RemediationCenterViewProps) {
  const [selectedIssueCategory, setSelectedIssueCategory] = useState<string>('all');
  const isPro = isUserFeatureUnlocked(user);

  // Calculate statistics across all pages
  const totalPages = pages.length;
  const pagesWithIssues = pages.filter(p => (p.issues?.length || 0) > 0);
  const criticalCount = pages.reduce((acc, p) => acc + (p.issues?.filter(i => i.type === 'critical').length || 0), 0);
  const warningCount = pages.reduce((acc, p) => acc + (p.issues?.filter(i => i.type === 'warning').length || 0), 0);
  const noticeCount = pages.reduce((acc, p) => acc + (p.issues?.filter(i => i.type === 'notice').length || 0), 0);

  // Breakdown of common fixable defect types
  const titleIssues = pages.filter(p => !p.title || p.title.length < 30 || p.title.length > 65);
  const metaDescIssues = pages.filter(p => !p.metaDescription || p.metaDescription.length < 70 || p.metaDescription.length > 160);
  const headingIssues = pages.filter(p => !p.h1 || p.h1.length === 0 || p.h1.length > 1);
  const altIssues = pages.filter(p => (p.imagesWithoutAlt || 0) > 0);
  const canonicalIssues = pages.filter(p => !p.canonicalUrl);
  const schemaIssues = pages.filter(p => !p.schemaValid);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-white text-[#202124] p-5 sm:p-6 rounded-lg border border-[#dadce0]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] text-xs font-medium">
              <Zap className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>Automated 1-Click Site Remediation Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#202124]">
              Auto-Fix All & Clean HTML Generator
            </h1>
            <p className="text-xs sm:text-sm text-[#5f6368] leading-relaxed">
              Synthesizes compliant JSON-LD schemas, repairs missing or truncated title tags, normalizes single-H1 heading hierarchies, injects context-aware image ALT text, and outputs production-ready clean HTML bundles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onTriggerFixAll}
              disabled={pages.length === 0 || isRunning}
              className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Fixing Pages ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Run Auto-Fix All Engine</span>
                </>
              )}
            </button>

            {fixAllSummary && (
              <button
                type="button"
                onClick={onOpenFixAllModal}
                className="px-3.5 py-2 bg-white hover:bg-[#f1f3f4] text-[#3c4043] rounded-md text-xs sm:text-sm font-medium border border-[#dadce0] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#5f6368]" />
                <span>View Remediation Diff</span>
              </button>
            )}

            <button
              type="button"
              onClick={onDownloadZip}
              disabled={pages.length === 0}
              className="px-3.5 py-2 bg-white hover:bg-[#f1f3f4] text-[#3c4043] rounded-md text-xs sm:text-sm font-medium border border-[#dadce0] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#1e8e3e]" />
              <span>Download Clean ZIP {!isPro && '(Pro)'}</span>
            </button>
          </div>
        </div>

        {/* Live Processing Progress Bar */}
        {isRunning && (
          <div className="mt-5 pt-4 border-t border-[#dadce0] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#1a73e8] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Processing: <span className="text-[#202124] truncate max-w-md">{currentProcessingUrl}</span>
              </span>
              <span className="text-[#1a73e8] font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#f1f3f4] rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#1a73e8] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Metrics & Issue Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#dadce0] space-y-1">
          <div className="text-xs font-medium text-[#5f6368]">Total Pages</div>
          <div className="text-2xl font-semibold text-[#202124]">{totalPages}</div>
          <div className="text-[11px] text-[#5f6368]">
            {pagesWithIssues.length} require HTML remediation
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#fad2cf] space-y-1 bg-[#fce8e6]/20">
          <div className="text-xs font-medium text-[#c5221f] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Critical Defects
          </div>
          <div className="text-2xl font-semibold text-[#c5221f]">{criticalCount}</div>
          <div className="text-[11px] text-[#c5221f]/80">Missing H1, empty titles, 4xx/5xx</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#feefc3] space-y-1 bg-[#fef7e0]/20">
          <div className="text-xs font-medium text-[#b06000] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Warnings
          </div>
          <div className="text-2xl font-semibold text-[#b06000]">{warningCount}</div>
          <div className="text-[11px] text-[#b06000]/80">Missing ALT tags, description length</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#ceead6] space-y-1 bg-[#e6f4ea]/20">
          <div className="text-xs font-medium text-[#137333] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Remediated Schemas
          </div>
          <div className="text-2xl font-semibold text-[#137333]">
            {summary.schemasGeneratedCount}
          </div>
          <div className="text-[11px] text-[#137333]/80">JSON-LD entities synthesized</div>
        </div>
      </div>

      {/* Remediation Modules Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-[#5f6368] uppercase tracking-wider">
          Automated Remediation Rules & Defect Inventory
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Rule 1: Title Tag */}
          <div className="bg-white p-4 rounded-lg border border-[#dadce0] space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#202124]">Title Tag Optimization</h3>
                <p className="text-xs text-[#5f6368]">Enforces 30–60 character length and site branding</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                titleIssues.length > 0 ? 'bg-[#fef7e0] text-[#b06000] border border-[#feefc3]' : 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
              }`}>
                {titleIssues.length} issues
              </span>
            </div>
            <div className="text-[11px] text-[#5f6368] bg-[#f8fafd] p-2.5 rounded-md border border-[#dadce0]">
              Auto-injects &lt;title&gt; based on H1 or URL path slug if missing.
            </div>
          </div>

          {/* Rule 2: Meta Description */}
          <div className="bg-white p-4 rounded-lg border border-[#dadce0] space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#202124]">Meta Description Synthesis</h3>
                <p className="text-xs text-[#5f6368]">Enforces 70–160 character snippet length</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                metaDescIssues.length > 0 ? 'bg-[#fef7e0] text-[#b06000] border border-[#feefc3]' : 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
              }`}>
                {metaDescIssues.length} issues
              </span>
            </div>
            <div className="text-[11px] text-[#5f6368] bg-[#f8fafd] p-2.5 rounded-md border border-[#dadce0]">
              Synthesizes description from leading page paragraphs if empty.
            </div>
          </div>

          {/* Rule 3: Heading Hierarchy */}
          <div className="bg-white p-4 rounded-lg border border-[#dadce0] space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#202124]">Heading Hierarchy (H1)</h3>
                <p className="text-xs text-[#5f6368]">Enforces strictly one &lt;h1&gt; per page</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                headingIssues.length > 0 ? 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]' : 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
              }`}>
                {headingIssues.length} issues
              </span>
            </div>
            <div className="text-[11px] text-[#5f6368] bg-[#f8fafd] p-2.5 rounded-md border border-[#dadce0]">
              Converts multiple duplicate &lt;h1&gt; tags to semantic &lt;h2&gt;.
            </div>
          </div>

          {/* Rule 4: Image Alt Text */}
          <div className="bg-white p-4 rounded-lg border border-[#dadce0] space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#202124]">Image Alt Attributes</h3>
                <p className="text-xs text-[#5f6368]">Injects descriptive context for WCAG AA</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                altIssues.length > 0 ? 'bg-[#fef7e0] text-[#b06000] border border-[#feefc3]' : 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
              }`}>
                {altIssues.length} pages
              </span>
            </div>
            <div className="text-[11px] text-[#5f6368] bg-[#f8fafd] p-2.5 rounded-md border border-[#dadce0]">
              Injects alt attributes derived from image filename or nearby context.
            </div>
          </div>

          {/* Rule 5: Canonical URLs */}
          <div className="bg-white p-4 rounded-lg border border-[#dadce0] space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#202124]">Canonical Link Integrity</h3>
                <p className="text-xs text-[#5f6368]">Ensures self-referential canonical tags</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                canonicalIssues.length > 0 ? 'bg-[#fef7e0] text-[#b06000] border border-[#feefc3]' : 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
              }`}>
                {canonicalIssues.length} issues
              </span>
            </div>
            <div className="text-[11px] text-[#5f6368] bg-[#f8fafd] p-2.5 rounded-md border border-[#dadce0]">
              Injects canonical link with clean absolute URL to prevent duplicates.
            </div>
          </div>

          {/* Rule 6: Schema.org JSON-LD */}
          <div className="bg-white p-4 rounded-lg border border-[#dadce0] space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#202124]">Schema.org Microdata</h3>
                <p className="text-xs text-[#5f6368]">Generates structured JSON-LD entity graph</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                Auto-Generated
              </span>
            </div>
            <div className="text-[11px] text-[#5f6368] bg-[#f8fafd] p-2.5 rounded-md border border-[#dadce0]">
              Embeds WebPage, Article, LocalBusiness, or FAQPage microdata script.
            </div>
          </div>
        </div>
      </div>

      {/* Pages Queue Table */}
      <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden">
        <div className="p-4 border-b border-[#dadce0] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-[#202124]">Pages Requiring Remediation ({pages.length})</h3>
            <p className="text-xs text-[#5f6368]">Click any URL to inspect issues or review corrected HTML code</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadCsv}
              disabled={pages.length === 0}
              className="px-3 py-1.5 bg-white hover:bg-[#f1f3f4] text-[#3c4043] rounded-md text-xs font-medium border border-[#dadce0] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Export Audit CSV {!isPro && '(Pro)'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafd] border-b border-[#dadce0] text-[#5f6368] font-medium sticky top-0 z-10">
              <tr>
                <th className="p-3">Page URL</th>
                <th className="p-3">Title Tag</th>
                <th className="p-3">Heading H1</th>
                <th className="p-3">Images Alt</th>
                <th className="p-3">Issues</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {pages.map((page, idx) => {
                const pageCrit = page.issues?.filter(i => i.type === 'critical').length || 0;
                const pageWarn = page.issues?.filter(i => i.type === 'warning').length || 0;

                return (
                  <tr key={idx} className="hover:bg-[#f8fafd] transition-colors">
                    <td className="p-3 text-[#202124] font-medium max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-[#5f6368] shrink-0" />
                        <span className="truncate" title={page.url}>{page.url}</span>
                      </div>
                    </td>
                    <td className="p-3 text-[#5f6368] max-w-xs truncate">
                      {page.title ? (
                        <span className="text-[#202124]" title={page.title}>{page.title}</span>
                      ) : (
                        <span className="text-[#c5221f] font-medium">&lt;Missing Title&gt;</span>
                      )}
                    </td>
                    <td className="p-3">
                      {page.h1 && page.h1.length === 1 ? (
                        <span className="text-[#137333] bg-[#e6f4ea] px-1.5 py-0.5 rounded border border-[#ceead6]">
                          1 H1 OK
                        </span>
                      ) : page.h1 && page.h1.length > 1 ? (
                        <span className="text-[#b06000] bg-[#fef7e0] px-1.5 py-0.5 rounded border border-[#feefc3]">
                          {page.h1.length} H1s (Multi)
                        </span>
                      ) : (
                        <span className="text-[#c5221f] bg-[#fce8e6] px-1.5 py-0.5 rounded border border-[#fad2cf] font-medium">
                          0 H1 (Missing)
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {page.imagesWithoutAlt && page.imagesWithoutAlt > 0 ? (
                        <span className="text-[#b06000] bg-[#fef7e0] px-1.5 py-0.5 rounded border border-[#feefc3]">
                          {page.imagesWithoutAlt} missing
                        </span>
                      ) : (
                        <span className="text-[#5f6368]">All set</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {pageCrit > 0 && (
                          <span className="px-1.5 py-0.5 bg-[#fce8e6] text-[#c5221f] rounded text-[10px] font-medium border border-[#fad2cf]">
                            {pageCrit} Crit
                          </span>
                        )}
                        {pageWarn > 0 && (
                          <span className="px-1.5 py-0.5 bg-[#fef7e0] text-[#b06000] rounded text-[10px] font-medium border border-[#feefc3]">
                            {pageWarn} Warn
                          </span>
                        )}
                        {pageCrit === 0 && pageWarn === 0 && (
                          <span className="text-[#137333] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Clean
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectPageAudit(page)}
                          className="px-2.5 py-1 bg-white hover:bg-[#f1f3f4] text-[#1a73e8] border border-[#dadce0] rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          Audit & Fix
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPageSchema(page)}
                          className="px-2.5 py-1 bg-white hover:bg-[#f1f3f4] text-[#3c4043] border border-[#dadce0] rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          Schema
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
