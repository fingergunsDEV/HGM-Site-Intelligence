'use client';

import React, { useState } from 'react';
import { 
  X, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  Wrench,
  Check,
  Code2,
  FileCode2,
  Copy,
  RefreshCw,
  Search,
  Globe,
  ShieldCheck,
  Zap,
  Download
} from 'lucide-react';
import { PageMetadata, AuditIssue } from '@/types/site-intelligence';
import { fixPageHtml } from '@/lib/html-fixer';

interface AuditDrawerProps {
  page: PageMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyFix?: (url: string, fixData: any) => void;
  onUpdatePageHtml?: (url: string, newHtml: string, updatedMetadata: Partial<PageMetadata>) => void;
  isPro?: boolean;
  onOpenSubscriptionModal?: (reason: 'copy' | 'export' | 'limit' | 'general') => void;
  onOpenFixAll?: () => void;
  baseUrl?: string;
}

export function AuditDrawer({ 
  page, 
  isOpen, 
  onClose, 
  onApplyFix, 
  onUpdatePageHtml,
  isPro = false,
  onOpenSubscriptionModal,
  onOpenFixAll,
  baseUrl = 'https://holisticgrowthmarketing.com'
}: AuditDrawerProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'html'>('audit');
  const [isFixing, setIsFixing] = useState(false);
  const [isAutoFixingHtml, setIsAutoFixingHtml] = useState(false);
  const [isReFetching, setIsReFetching] = useState(false);
  const [aiFixes, setAiFixes] = useState<{ url: string; data: any } | null>(null);
  const [applied, setApplied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [htmlSearch, setHtmlSearch] = useState('');
  const [htmlFixNotice, setHtmlFixNotice] = useState<string | null>(null);


  if (!isOpen || !page) return null;

  const currentFixes = aiFixes?.url === page.url ? aiFixes.data : null;
  const criticalIssues = page.issues.filter(i => i.type === 'critical');
  const warningIssues = page.issues.filter(i => i.type === 'warning');
  const noticeIssues = page.issues.filter(i => i.type === 'notice');

  const handleGenerateAiFix = async () => {
    setIsFixing(true);
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'audit-fix',
          pageData: page,
          issues: page.issues
        })
      });
      const data = await res.json();
      if (data?.fixes) {
        setAiFixes({ url: page.url, data: data.fixes });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFixing(false);
    }
  };

  const handleApplyFix = () => {
    if (onApplyFix && currentFixes) {
      onApplyFix(page.url, currentFixes);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  const handleReFetchLiveHtml = async () => {
    setIsReFetching(true);
    try {
      const res = await fetch('/api/crawl/page-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: page.url })
      });
      const data = await res.json();
      if (data.success && onUpdatePageHtml) {
        onUpdatePageHtml(page.url, data.rawHtml, {
          title: data.title,
          metaDescription: data.metaDescription,
          canonicalUrl: data.canonicalUrl,
          h1: data.h1,
          h2: data.h2,
          wordCount: data.wordCount,
          rawHtml: data.rawHtml,
          htmlSizeBytes: data.htmlSizeBytes,
          isLiveFetched: true,
          lastFetchedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to re-fetch live HTML:', err);
    } finally {
      setIsReFetching(false);
    }
  };

  const handleAutoFixSinglePageHtml = () => {
    if (!page) return;
    setIsAutoFixingHtml(true);
    try {
      const fixResult = fixPageHtml(page, baseUrl);
      if (onUpdatePageHtml) {
        onUpdatePageHtml(page.url, fixResult.correctedHtml, {
          ...fixResult.updatedMetadata,
          rawHtml: fixResult.correctedHtml,
          issues: fixResult.updatedMetadata.issues,
          isLiveFetched: true,
          lastFetchedAt: new Date().toISOString()
        });
      }
      setHtmlFixNotice(`Successfully applied ${fixResult.fixedIssues.length} fixes & generated clean HTML!`);
      setTimeout(() => setHtmlFixNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to auto-fix page HTML:', err);
    } finally {
      setIsAutoFixingHtml(false);
    }
  };

  const handleCopyHtml = () => {
    if (!isPro) {
      if (onOpenSubscriptionModal) onOpenSubscriptionModal('copy');
      return;
    }
    if (page.rawHtml) {
      navigator.clipboard.writeText(page.rawHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  // Filtered HTML lines for searching inside the source
  const rawHtmlText = page.rawHtml || `<!-- Live HTML not yet pulled. Click 'Pull Live HTML' above to fetch. -->\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <title>${page.title}</title>\n  <meta name="description" content="${page.metaDescription}">\n  <link rel="canonical" href="${page.canonicalUrl}">\n</head>\n<body>\n  <h1>${page.h1?.[0] || page.title}</h1>\n  <p>Word Count: ${page.wordCount} words</p>\n</body>\n</html>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>SEO & Live HTML Inspection</span>
                {page.isLiveFetched && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live HTTP
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-md">
                {page.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Open Live URL in new tab"
            >
              <Globe className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>SEO Violations ({page.issues.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'html'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Live Page HTML {page.htmlSizeBytes ? `(${(page.htmlSizeBytes / 1024).toFixed(1)} KB)` : ''}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleReFetchLiveHtml}
            disabled={isReFetching}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors disabled:opacity-50"
            title="Re-scrape and pull fresh HTML from remote server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReFetching ? 'animate-spin' : ''}`} />
            <span>{isReFetching ? 'Fetching Live...' : 'Re-fetch Live HTML'}</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'audit' ? (
            <>
              {/* Current Page Snapshot */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 font-mono">
                <div>
                  <span className="text-slate-400 font-semibold uppercase">Title Tag: </span>
                  <span className="text-slate-800 font-bold">{page.title || '(Empty)'}</span>
                  <span className="text-slate-400 ml-1">({page.title?.length || 0} chars)</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase">Meta Description: </span>
                  <span className="text-slate-700">{page.metaDescription || '(Empty)'}</span>
                  <span className="text-slate-400 ml-1">({page.metaDescription?.length || 0} chars)</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">H1 Count: </span>
                    <span className="text-slate-800 font-bold">{page.h1?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Canonical: </span>
                    <span className="text-slate-800">{page.canonicalUrl ? 'Present' : 'Missing'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Missing Alt: </span>
                    <span className="text-slate-800">{page.imagesWithoutAlt || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase">Word Count: </span>
                    <span className="text-slate-800 font-bold">{page.wordCount || 0} words</span>
                  </div>
                </div>
              </div>

              {/* Audit Issues List */}
              {page.issues.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-emerald-900">Zero Critical SEO Violations</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    This page adheres to standard technical SEO, heading hierarchy, and meta tag rules.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Detected Violations ({page.issues.length})
                  </h4>

                  {/* Critical */}
                  {criticalIssues.map((issue) => (
                    <div key={issue.id} className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-200 text-rose-900 uppercase">
                          CRITICAL • {issue.category}
                        </span>
                        <span className="text-xs font-bold text-rose-950 font-mono">{issue.code}</span>
                      </div>
                      <p className="text-xs font-semibold text-rose-900">{issue.message}</p>
                      <p className="text-[11px] text-rose-700 bg-rose-100/60 p-2 rounded-lg">
                        💡 <span className="font-semibold">Recommendation:</span> {issue.recommendation}
                      </p>
                    </div>
                  ))}

                  {/* Warnings */}
                  {warningIssues.map((issue) => (
                    <div key={issue.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900 uppercase">
                          WARNING • {issue.category}
                        </span>
                        <span className="text-xs font-bold text-amber-950 font-mono">{issue.code}</span>
                      </div>
                      <p className="text-xs font-semibold text-amber-900">{issue.message}</p>
                      <p className="text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg">
                        💡 <span className="font-semibold">Recommendation:</span> {issue.recommendation}
                      </p>
                    </div>
                  ))}

                  {/* Notices */}
                  {noticeIssues.map((issue) => (
                    <div key={issue.id} className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-200 text-blue-900 uppercase">
                          NOTICE • {issue.category}
                        </span>
                        <span className="text-xs font-bold text-blue-950 font-mono">{issue.code}</span>
                      </div>
                      <p className="text-xs font-semibold text-blue-900">{issue.message}</p>
                      <p className="text-[11px] text-blue-800 bg-blue-100/60 p-2 rounded-lg">
                        💡 <span className="font-semibold">Recommendation:</span> {issue.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Fix Recommendations Preview */}
              {currentFixes && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Gemini AI Optimized Recommendations
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyFix}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {applied ? <Check className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                      <span>{applied ? 'Applied!' : 'Apply Fixes'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="bg-white p-2.5 rounded border border-indigo-100">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Optimized Title: </span>
                      <div className="text-slate-900 font-semibold">{currentFixes.optimizedTitle}</div>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-indigo-100">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Optimized Meta Description: </span>
                      <div className="text-slate-800">{currentFixes.optimizedDescription}</div>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-indigo-100">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Canonical Tag: </span>
                      <div className="text-indigo-600">{currentFixes.canonicalTag}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Live Raw HTML Source View */
            <div className="space-y-3">
              {htmlFixNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{htmlFixNotice}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-slate-300 p-2.5 rounded-lg text-xs font-mono">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search inside live HTML source..."
                    value={htmlSearch}
                    onChange={(e) => setHtmlSearch(e.target.value)}
                    className="bg-transparent border-0 focus:outline-none text-white text-xs w-full placeholder:text-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFixSinglePageHtml}
                    disabled={isAutoFixingHtml}
                    className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                    title="Clean HTML, embed Schema, fix Title/Meta & H1 tags"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isAutoFixingHtml ? 'Fixing HTML...' : 'Auto-Fix HTML & Embed Schema'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition-colors cursor-pointer"
                  >
                    {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHtml ? 'Copied' : 'Copy HTML'}</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="max-h-[500px] overflow-auto p-4 font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre font-normal selection:bg-indigo-600 selection:text-white">
                  {rawHtmlText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isAutoFixingHtml}
              onClick={handleAutoFixSinglePageHtml}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isAutoFixingHtml ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Fixing Page HTML...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Auto-Fix Page HTML</span>
                </>
              )}
            </button>

            {onOpenFixAll && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFixAll();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fix All Pages in Sitemap</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isFixing}
              onClick={handleGenerateAiFix}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer"
            >
              {isFixing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Suggestions</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
