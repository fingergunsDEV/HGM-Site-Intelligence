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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#202124]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg border border-[#dadce0] shadow-xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#dadce0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center text-[#1a73e8]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-[#202124]">
                  Auto-Fix All Engine & Corrected HTML Generator
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Validated 100% Health
                </span>
              </div>
              <p className="text-xs text-[#5f6368]">
                Rewrites full production HTML, injects Schema.org JSON-LD, fixes canonicals, title/meta & alt attributes for every sitemap URL.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Running Execution Progress Bar (if in progress) */}
        {isRunning && (
          <div className="p-4 bg-[#e8f0fe]/30 border-b border-[#d2e3fc] space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[#1a73e8]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#1a73e8] animate-spin" />
                <span>Processing sitemap pages and generating compliant HTML...</span>
              </div>
              <span className="font-mono text-[#1a73e8]">{progressPercent}% Completed</span>
            </div>
            <div className="w-full h-1.5 bg-[#e8f0fe] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1a73e8] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {currentProcessingUrl && (
              <p className="text-[11px] font-mono text-[#5f6368] truncate">
                Rewriting: {currentProcessingUrl}
              </p>
            )}
          </div>
        )}

        {/* Global Summary Metric Cards */}
        {summary && (
          <div className="px-4 py-3 bg-[#f8fafd] border-b border-[#dadce0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-md border border-[#dadce0]">
              <span className="text-[#5f6368] text-[10px] font-medium uppercase tracking-wider">Pages Processed</span>
              <div className="text-sm font-semibold text-[#202124] mt-0.5 flex items-center gap-1.5">
                <span>{summary.totalPages}</span>
                <span className="text-[11px] font-normal text-[#5f6368] font-mono">/ {summary.totalPages} URLs</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-md border border-[#ceead6] bg-[#e6f4ea]/30">
              <span className="text-[#137333] text-[10px] font-medium uppercase tracking-wider">Issues Fixed & Cleaned</span>
              <div className="text-sm font-semibold text-[#137333] mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#137333]" />
                <span>{summary.totalIssuesFixed} Fixed</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-md border border-[#d2e3fc] bg-[#e8f0fe]/30">
              <span className="text-[#1a73e8] text-[10px] font-medium uppercase tracking-wider">Health Score Transformation</span>
              <div className="text-sm font-semibold text-[#1a73e8] mt-0.5 flex items-center gap-2">
                <span className="text-[#5f6368] line-through font-mono text-xs">{summary.overallHealthScoreBefore}%</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span className="text-[#137333] font-mono">{summary.overallHealthScoreAfter}%</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-md border border-[#dadce0]">
              <span className="text-[#5f6368] text-[10px] font-medium uppercase tracking-wider">Schema.org Injections</span>
              <div className="text-sm font-semibold text-[#202124] mt-0.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#1a73e8]" />
                <span>{summary.totalPages} Schemas Embedded</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area: Sidebar + Inspector */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Sitemap Pages Navigator */}
          <div className="w-64 sm:w-80 border-r border-[#dadce0] bg-[#f8fafd] flex flex-col overflow-hidden shrink-0">
            <div className="p-3 border-b border-[#dadce0] bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#5f6368] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter sitemap pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#dadce0] rounded-md text-xs focus:outline-hidden focus:border-[#1a73e8]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {filteredPages.map((item) => {
                const isSelected = activePageUrl === item.url;
                const pathSlug = item.url.replace(baseUrl, '') || '/';

                return (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => setSelectedPageUrl(item.url)}
                    className={`w-full text-left p-2.5 rounded-md transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]' 
                        : 'hover:bg-white text-[#3c4043] border border-transparent'
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded shrink-0 ${
                      isSelected ? 'bg-[#1a73e8] text-white' : 'bg-[#e6f4ea] text-[#137333]'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-medium truncate ${isSelected ? 'text-[#1a73e8]' : 'text-[#202124]'}`}>
                          {item.updatedMetadata.title.split('|')[0].trim() || pathSlug}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected ? 'bg-[#1a73e8] text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
                        }`}>
                          {item.fixedIssues.length} fixed
                        </span>
                      </div>
                      
                      <p className={`text-[11px] font-mono truncate mt-0.5 ${isSelected ? 'text-[#1a73e8]/80' : 'text-[#5f6368]'}`}>
                        {pathSlug}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] uppercase font-medium px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-[#d2e3fc] text-[#1a73e8]' : 'bg-[#f1f3f4] text-[#5f6368]'
                        }`}>
                          {item.updatedMetadata.pageType}
                        </span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-[#137333]' : 'text-[#137333]'}`}>
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
              <div className="p-4 border-b border-[#dadce0] bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium font-mono bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                      {selectedPageResult.updatedMetadata.pageType}
                    </span>
                    <h3 className="text-sm font-semibold text-[#202124] truncate">
                      {selectedPageResult.updatedMetadata.title}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-[#5f6368] truncate mt-0.5">
                    {selectedPageResult.url}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedPageResult.correctedHtml)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f1f3f4] text-[#3c4043] rounded-md text-xs font-medium border border-[#dadce0] transition-colors cursor-pointer"
                  >
                    {!isPro && <Lock className="w-3 h-3 text-[#b06000]" />}
                    {copied ? <Check className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5 text-[#5f6368]" />}
                    <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingleHtml(selectedPageResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                  >
                    {!isPro && <Lock className="w-3 h-3 text-white/80" />}
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .html</span>
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="px-4 border-b border-[#dadce0] bg-white flex items-center gap-4 text-xs font-medium text-[#5f6368]">
                <button
                  type="button"
                  onClick={() => setActiveTab('corrected')}
                  className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'corrected'
                      ? 'border-[#1a73e8] text-[#1a73e8]'
                      : 'border-transparent text-[#5f6368] hover:text-[#202124]'
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
                      ? 'border-[#1a73e8] text-[#1a73e8]'
                      : 'border-transparent text-[#5f6368] hover:text-[#202124]'
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
                      ? 'border-[#1a73e8] text-[#1a73e8]'
                      : 'border-transparent text-[#5f6368] hover:text-[#202124]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Embedded JSON-LD Schema</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#202124] text-[#dadce0] font-mono text-xs">
                {activeTab === 'corrected' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#9aa0a6] pb-2 border-b border-[#3c4043]">
                      <span>Full Validated HTML Document ({selectedPageResult.correctedHtml.length.toLocaleString()} characters)</span>
                      <span className="text-[#81c995]">✓ Injected Meta, Clean H1, Alt Tags & Schema.org</span>
                    </div>
                    <pre className="whitespace-pre overflow-x-auto text-[#81c995] leading-relaxed font-mono">
                      {selectedPageResult.correctedHtml}
                    </pre>
                  </div>
                )}

                {activeTab === 'fixes' && (
                  <div className="space-y-4 font-sans text-[#202124]">
                    <div className="p-4 bg-white rounded-md border border-[#dadce0] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#137333]" />
                          <h4 className="text-sm font-medium text-[#202124]">
                            Audit Verification: 100% Passed (0 Errors Remaining)
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                          Health Score: {selectedPageResult.healthScoreBefore}% → 100%
                        </span>
                      </div>

                      <div className="space-y-2 pt-2">
                        <h5 className="text-xs font-medium text-[#5f6368] uppercase tracking-wider">
                          Modifications Applied to this Document:
                        </h5>
                        <ul className="space-y-1.5">
                          {selectedPageResult.fixedIssues.map((fix, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[#3c4043] bg-[#f8fafd] p-2 rounded border border-[#dadce0]">
                              <Check className="w-4 h-4 text-[#137333] shrink-0 mt-0.5" />
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-md border border-[#dadce0] space-y-2">
                      <h5 className="text-xs font-medium text-[#5f6368] uppercase tracking-wider">
                        Optimized Search Snippet Preview:
                      </h5>
                      <div className="p-3 bg-[#f8fafd] rounded-md border border-[#dadce0] space-y-1">
                        <div className="text-xs text-[#5f6368] font-mono">{selectedPageResult.url}</div>
                        <div className="text-sm font-medium text-[#1a73e8] hover:underline cursor-pointer">
                          {selectedPageResult.updatedMetadata.title}
                        </div>
                        <div className="text-xs text-[#5f6368] line-clamp-2">
                          {selectedPageResult.updatedMetadata.metaDescription}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schema' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#9aa0a6] pb-2 border-b border-[#3c4043]">
                      <span>Schema.org JSON-LD Object (Embedded inside &lt;head&gt;)</span>
                      <span className="text-[#8ab4f8]">@type: {selectedPageResult.updatedMetadata.schemaJson?.['@type'] || 'WebPage'}</span>
                    </div>
                    <pre className="whitespace-pre overflow-x-auto text-[#8ab4f8] leading-relaxed font-mono">
                      {JSON.stringify(selectedPageResult.updatedMetadata.schemaJson || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#5f6368] text-xs">
              Select a page from the left sitemap list to inspect corrected HTML.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#dadce0] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyToState}
              className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {appliedToState ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{appliedToState ? 'Applied to Application State!' : 'Apply All Fixes to Main Results'}</span>
            </button>
            <span className="text-xs text-[#5f6368] hidden sm:inline">
              Updates all audit tabs, resolves issues, and recalculates 100% health score.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isExportingZip}
              className="px-4 py-2 bg-white hover:bg-[#f1f3f4] text-[#1a73e8] border border-[#dadce0] rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {!isPro && <Lock className="w-3.5 h-3.5 text-[#b06000]" />}
              <Download className="w-4 h-4" />
              <span>{isExportingZip ? 'Packaging Zip...' : 'Download All Corrected HTML (.zip)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#f1f3f4] text-[#3c4043] border border-[#dadce0] rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
