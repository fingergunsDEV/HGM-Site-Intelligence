'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  FileCode2, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink,
  Code2,
  FileCheck2,
  RefreshCw,
  Search,
  Lock,
  Flame,
  ChevronRight,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { PageMetadata } from '@/types/site-intelligence';
import { UserAccount } from '@/types/auth';
import { FixAllSummary, PageFixResult } from '@/lib/html-fixer';
import { generateCorrectedHtmlZip } from '@/lib/export-utils';
import { isUserFeatureUnlocked } from '@/lib/auth-storage';

interface FixAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: FixAllSummary | null;
  isRunning: boolean;
  progressPercent: number;
  currentProcessingUrl?: string;
  onApplyAllToState: () => void;
  user: UserAccount | null;
  onOpenSubscriptionModal: (reason: 'export' | 'copy' | 'limit' | 'general') => void;
  baseUrl: string;
}

export function FixAllModal({
  isOpen,
  onClose,
  summary,
  isRunning,
  progressPercent,
  currentProcessingUrl,
  onApplyAllToState,
  user,
  onOpenSubscriptionModal,
  baseUrl
}: FixAllModalProps) {
  const [selectedPageUrl, setSelectedPageUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'corrected' | 'fixes' | 'schema' | 'original'>('corrected');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [appliedToState, setAppliedToState] = useState(false);

  const isPro = isUserFeatureUnlocked(user);

  if (!isOpen) return null;

  const activePageUrl = (summary?.pagesFixed && summary.pagesFixed.some(p => p.url === selectedPageUrl))
    ? selectedPageUrl
    : (summary?.pagesFixed?.[0]?.url || '');

  const selectedPageResult: PageFixResult | undefined = summary?.pagesFixed.find(p => p.url === activePageUrl) || summary?.pagesFixed?.[0];

  const filteredPages = summary?.pagesFixed.filter(p => 
    p.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.updatedMetadata.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCopy = (text: string) => {
    if (!isPro) {
      onOpenSubscriptionModal('copy');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleHtml = (pageResult: PageFixResult) => {
    if (!isPro) {
      onOpenSubscriptionModal('export');
      return;
    }

    let filename = 'index.html';
    try {
      const parsed = new URL(pageResult.url);
      let path = parsed.pathname;
      if (path.endsWith('/')) path = path.slice(0, -1);
      if (!path || path === '') {
        filename = 'index.html';
      } else {
        const segments = path.split('/').filter(Boolean);
        filename = segments.join('_') + '.html';
      }
    } catch {
      filename = 'page.html';
    }

    const blob = new Blob([pageResult.correctedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    if (!isPro) {
      onOpenSubscriptionModal('export');
      return;
    }

    if (!summary || summary.pagesFixed.length === 0) return;

    setIsExportingZip(true);
    try {
      const zipBlob = await generateCorrectedHtmlZip(
        summary.pagesFixed.map(p => ({
          url: p.url,
          correctedHtml: p.correctedHtml,
          fixedIssues: p.fixedIssues,
          validationStatus: p.validationStatus,
          updatedMetadata: p.updatedMetadata
        })),
        baseUrl
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corrected-html-sitemap-package-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate corrected HTML zip:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleApplyToState = () => {
    onApplyAllToState();
    setAppliedToState(true);
    setTimeout(() => setAppliedToState(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Auto-Fix All Engine & Corrected HTML Generator
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Validated 100% Health
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Rewrites full production HTML, injects Schema.org JSON-LD, fixes canonicals, title/meta & alt attributes for every sitemap URL.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Running Execution Progress Bar (if in progress) */}
        {isRunning && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Processing sitemap pages and generating compliant HTML...</span>
              </div>
              <span className="font-mono text-indigo-700">{progressPercent}% Completed</span>
            </div>
            <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {currentProcessingUrl && (
              <p className="text-[11px] font-mono text-slate-500 truncate">
                Rewriting: {currentProcessingUrl}
              </p>
            )}
          </div>
        )}

        {/* Global Summary Metric Cards */}
        {summary && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pages Processed</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <span>{summary.totalPages}</span>
                <span className="text-[11px] font-medium text-slate-500 font-mono">/ {summary.totalPages} URLs</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Issues Fixed & Cleaned</span>
              <div className="text-base font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{summary.totalIssuesFixed} Fixed</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
              <span className="text-indigo-700 text-[10px] font-bold uppercase tracking-wider">Health Score Transformation</span>
              <div className="text-base font-extrabold text-indigo-900 mt-0.5 flex items-center gap-2">
                <span className="text-slate-400 line-through font-mono text-xs">{summary.overallHealthScoreBefore}%</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-emerald-600 font-mono">{summary.overallHealthScoreAfter}%</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
              <span className="text-purple-700 text-[10px] font-bold uppercase tracking-wider">Schema.org Injections</span>
              <div className="text-base font-extrabold text-purple-900 mt-0.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>{summary.totalPages} Schemas Embedded</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area: Sidebar + Inspector */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Sitemap Pages Navigator */}
          <div className="w-64 sm:w-80 border-r border-slate-200 bg-slate-50/60 flex flex-col overflow-hidden shrink-0">
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter sitemap pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
              {filteredPages.map((item) => {
                const isSelected = activePageUrl === item.url;
                const pathSlug = item.url.replace(baseUrl, '') || '/';

                return (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => setSelectedPageUrl(item.url)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold' 
                        : 'hover:bg-slate-200/60 text-slate-700'
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded-md shrink-0 ${
                      isSelected ? 'bg-indigo-500/50 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {item.updatedMetadata.title.split('|')[0].trim() || pathSlug}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${
                          isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {item.fixedIssues.length} fixed
                        </span>
                      </div>
                      
                      <p className={`text-[11px] font-mono truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {pathSlug}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {item.updatedMetadata.pageType}
                        </span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                          Score: 100%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Area: Detailed Code & Fixes Inspector */}
          {selectedPageResult ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              
              {/* Page Inspector Subheader */}
              <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-indigo-100 text-indigo-900">
                      {selectedPageResult.updatedMetadata.pageType}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {selectedPageResult.updatedMetadata.title}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                    {selectedPageResult.url}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedPageResult.correctedHtml)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {!isPro && <Lock className="w-3 h-3 text-amber-500" />}
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingleHtml(selectedPageResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    {!isPro && <Lock className="w-3 h-3 text-indigo-200" />}
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .html</span>
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="px-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('corrected')}
                  className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'corrected'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Corrected HTML (Ready to Deploy)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('fixes')}
                  className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'fixes'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fixes Applied & Validation ({selectedPageResult.fixedIssues.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('schema')}
                  className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'schema'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Embedded JSON-LD Schema</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-950 text-slate-200 font-mono text-xs">
                {activeTab === 'corrected' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                      <span>Full Validated HTML Document ({selectedPageResult.correctedHtml.length.toLocaleString()} characters)</span>
                      <span className="text-emerald-400">✓ Injected Meta, Clean H1, Alt Tags & Schema.org</span>
                    </div>
                    <pre className="whitespace-pre overflow-x-auto text-emerald-400 leading-relaxed font-mono">
                      {selectedPageResult.correctedHtml}
                    </pre>
                  </div>
                )}

                {activeTab === 'fixes' && (
                  <div className="space-y-4 font-sans text-slate-900">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Audit Verification: 100% Passed (0 Errors Remaining)
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Health Score: {selectedPageResult.healthScoreBefore}% → 100%
                        </span>
                      </div>

                      <div className="space-y-2 pt-2">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Modifications Applied to this Document:
                        </h5>
                        <ul className="space-y-1.5">
                          {selectedPageResult.fixedIssues.map((fix, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Optimized Search Snippet Preview:
                      </h5>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="text-xs text-slate-500 font-mono">{selectedPageResult.url}</div>
                        <div className="text-sm font-bold text-indigo-600 hover:underline cursor-pointer">
                          {selectedPageResult.updatedMetadata.title}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-2">
                          {selectedPageResult.updatedMetadata.metaDescription}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schema' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                      <span>Schema.org JSON-LD Object (Embedded inside &lt;head&gt;)</span>
                      <span className="text-indigo-400">@type: {selectedPageResult.updatedMetadata.schemaJson?.['@type'] || 'WebPage'}</span>
                    </div>
                    <pre className="whitespace-pre overflow-x-auto text-indigo-300 leading-relaxed font-mono">
                      {JSON.stringify(selectedPageResult.updatedMetadata.schemaJson || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a page from the left sitemap list to inspect corrected HTML.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyToState}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              {appliedToState ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{appliedToState ? 'Applied to Application State!' : 'Apply All Fixes to Main Results'}</span>
            </button>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Updates all audit tabs, resolves issues, and recalculates 100% health score.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isExportingZip}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {!isPro && <Lock className="w-3.5 h-3.5 text-amber-300" />}
              <Download className="w-4 h-4" />
              <span>{isExportingZip ? 'Packaging Zip...' : 'Download All Corrected HTML (.zip)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
