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
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Automated 1-Click Site Remediation Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Auto-Fix All & Clean HTML Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Synthesizes compliant JSON-LD schemas, repairs missing or truncated title tags, normalizes single-H1 heading hierarchies, injects context-aware image ALT text, and outputs production-ready clean HTML bundles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onTriggerFixAll}
              disabled={pages.length === 0 || isRunning}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Fixing Pages ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run Auto-Fix All Engine</span>
                </>
              )}
            </button>

            {fixAllSummary && (
              <button
                type="button"
                onClick={onOpenFixAllModal}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold border border-white/20 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-indigo-300" />
                <span>View Remediation Diff</span>
              </button>
            )}

            <button
              type="button"
              onClick={onDownloadZip}
              disabled={pages.length === 0}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Clean ZIP {!isPro && '(Pro)'}</span>
            </button>
          </div>
        </div>

        {/* Live Processing Progress Bar */}
        {isRunning && (
          <div className="mt-5 pt-4 border-t border-indigo-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-indigo-300 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Processing: <span className="text-white truncate max-w-md">{currentProcessingUrl}</span>
              </span>
              <span className="text-amber-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-amber-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Metrics & Issue Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Total Pages</div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalPages}</div>
          <div className="text-[11px] text-slate-500">
            {pagesWithIssues.length} require HTML remediation
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs space-y-1 bg-rose-50/20">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Critical Defects
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">{criticalCount}</div>
          <div className="text-[11px] text-rose-600/80">Missing H1, empty titles, 4xx/5xx</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-1 bg-amber-50/20">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Warnings
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">{warningCount}</div>
          <div className="text-[11px] text-amber-600/80">Missing ALT tags, description length</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-1 bg-emerald-50/20">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Remediated Schemas
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {summary.schemasGeneratedCount}
          </div>
          <div className="text-[11px] text-emerald-600/80">JSON-LD entities synthesized</div>
        </div>
      </div>

      {/* Remediation Modules Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
          Automated Remediation Rules & Defect Inventory
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Rule 1: Title Tag */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Title Tag Optimization</h3>
                <p className="text-xs text-slate-500">Enforces 30–60 character length and appends site branding</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                titleIssues.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {titleIssues.length} issues
              </span>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
              Auto-injects &lt;title&gt; based on H1 or URL path slug if missing.
            </div>
          </div>

          {/* Rule 2: Meta Description */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Meta Description Synthesis</h3>
                <p className="text-xs text-slate-500">Enforces 70–160 character snippet length</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                metaDescIssues.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {metaDescIssues.length} issues
              </span>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
              Synthesizes description from leading page paragraphs if empty.
            </div>
          </div>

          {/* Rule 3: Heading Hierarchy */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Heading Hierarchy (H1)</h3>
                <p className="text-xs text-slate-500">Enforces strictly one &lt;h1&gt; per page</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                headingIssues.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {headingIssues.length} issues
              </span>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
              Converts multiple duplicate &lt;h1&gt; tags to semantic &lt;h2&gt;.
            </div>
          </div>

          {/* Rule 4: Image Alt Text */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Image Alt Attributes</h3>
                <p className="text-xs text-slate-500">Injects descriptive context for WCAG AA</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                altIssues.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {altIssues.length} pages
              </span>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
              Injects alt attributes derived from image filename or nearby context.
            </div>
          </div>

          {/* Rule 5: Canonical URLs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Canonical Link Integrity</h3>
                <p className="text-xs text-slate-500">Ensures self-referential canonical tags</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                canonicalIssues.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {canonicalIssues.length} issues
              </span>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
              Injects canonical link with clean absolute URL to prevent duplicates.
            </div>
          </div>

          {/* Rule 6: Schema.org JSON-LD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schema.org Microdata</h3>
                <p className="text-xs text-slate-500">Generates structured JSON-LD entity graph</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-indigo-100 text-indigo-800">
                Auto-Generated
              </span>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
              Embeds WebPage, Article, LocalBusiness, or FAQPage microdata script.
            </div>
          </div>
        </div>
      </div>

      {/* Pages Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pages Requiring Remediation ({pages.length})</h3>
            <p className="text-xs text-slate-500">Click any URL to inspect issues or review corrected HTML code</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadCsv}
              disabled={pages.length === 0}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Export Audit CSV {!isPro && '(Pro)'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono sticky top-0 z-10">
              <tr>
                <th className="p-3 font-semibold">Page URL</th>
                <th className="p-3 font-semibold">Title Tag</th>
                <th className="p-3 font-semibold">Heading H1</th>
                <th className="p-3 font-semibold">Images Alt</th>
                <th className="p-3 font-semibold">Issues</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {pages.map((page, idx) => {
                const pageCrit = page.issues?.filter(i => i.type === 'critical').length || 0;
                const pageWarn = page.issues?.filter(i => i.type === 'warning').length || 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-slate-900 font-medium max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={page.url}>{page.url}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {page.title ? (
                        <span className="text-slate-800" title={page.title}>{page.title}</span>
                      ) : (
                        <span className="text-rose-600 font-mono font-bold">&lt;Missing Title&gt;</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {page.h1 && page.h1.length === 1 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          1 H1 OK
                        </span>
                      ) : page.h1 && page.h1.length > 1 ? (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {page.h1.length} H1s (Multi)
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold">
                          0 H1 (Missing)
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {page.imagesWithoutAlt && page.imagesWithoutAlt > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {page.imagesWithoutAlt} missing
                        </span>
                      ) : (
                        <span className="text-slate-400">All set</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {pageCrit > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold font-mono">
                            {pageCrit} Crit
                          </span>
                        )}
                        {pageWarn > 0 && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold font-mono">
                            {pageWarn} Warn
                          </span>
                        )}
                        {pageCrit === 0 && pageWarn === 0 && (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
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
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Audit & Fix
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPageSchema(page)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
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
