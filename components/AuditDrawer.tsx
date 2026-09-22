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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg border border-[#dadce0] shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#dadce0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#fce8e6] border border-[#fad2cf] flex items-center justify-center text-[#c5221f]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#202124] flex items-center gap-2">
                <span>SEO & Live HTML Inspection</span>
                {page.isLiveFetched && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                    Live HTTP
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#5f6368] font-mono truncate max-w-md">
                {page.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md transition-colors"
              title="Open Live URL in new tab"
            >
              <Globe className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-[#dadce0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-[#1a73e8] text-[#1a73e8]'
                  : 'border-transparent text-[#5f6368] hover:text-[#202124]'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>SEO Violations ({page.issues.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'html'
                  ? 'border-[#1a73e8] text-[#1a73e8]'
                  : 'border-transparent text-[#5f6368] hover:text-[#202124]'
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
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#3c4043] hover:text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md border border-[#dadce0] transition-colors disabled:opacity-50 cursor-pointer"
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
              <div className="p-3.5 bg-[#f8fafd] border border-[#dadce0] rounded-md text-xs space-y-2 font-mono">
                <div>
                  <span className="text-[#5f6368] uppercase text-[11px]">Title Tag: </span>
                  <span className="text-[#202124] font-medium">{page.title || '(Empty)'}</span>
                  <span className="text-[#5f6368] ml-1">({page.title?.length || 0} chars)</span>
                </div>
                <div>
                  <span className="text-[#5f6368] uppercase text-[11px]">Meta Description: </span>
                  <span className="text-[#3c4043]">{page.metaDescription || '(Empty)'}</span>
                  <span className="text-[#5f6368] ml-1">({page.metaDescription?.length || 0} chars)</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-[#5f6368] uppercase text-[11px]">H1 Count: </span>
                    <span className="text-[#202124] font-medium">{page.h1?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-[#5f6368] uppercase text-[11px]">Canonical: </span>
                    <span className="text-[#202124]">{page.canonicalUrl ? 'Present' : 'Missing'}</span>
                  </div>
                  <div>
                    <span className="text-[#5f6368] uppercase text-[11px]">Missing Alt: </span>
                    <span className="text-[#202124]">{page.imagesWithoutAlt || 0}</span>
                  </div>
                  <div>
                    <span className="text-[#5f6368] uppercase text-[11px]">Word Count: </span>
                    <span className="text-[#202124] font-medium">{page.wordCount || 0} words</span>
                  </div>
                </div>
              </div>

              {/* Audit Issues List */}
              {page.issues.length === 0 ? (
                <div className="p-8 text-center bg-[#e6f4ea]/50 border border-[#ceead6] rounded-md">
                  <CheckCircle2 className="w-8 h-8 text-[#137333] mx-auto mb-2" />
                  <h4 className="text-sm font-medium text-[#137333]">Zero Critical SEO Violations</h4>
                  <p className="text-xs text-[#137333]/80 mt-1">
                    This page adheres to standard technical SEO, heading hierarchy, and meta tag rules.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-[#5f6368] uppercase tracking-wider">
                    Detected Violations ({page.issues.length})
                  </h4>

                  {/* Critical */}
                  {criticalIssues.map((issue) => (
                    <div key={issue.id} className="p-3 bg-[#fce8e6]/30 border border-[#fad2cf] rounded-md space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#fce8e6] text-[#c5221f] uppercase border border-[#fad2cf]">
                          CRITICAL • {issue.category}
                        </span>
                        <span className="text-xs font-medium text-[#c5221f] font-mono">{issue.code}</span>
                      </div>
                      <p className="text-xs font-medium text-[#202124]">{issue.message}</p>
                      <p className="text-[11px] text-[#5f6368] bg-white p-2 rounded border border-[#fad2cf]/60">
                        💡 <span className="font-medium text-[#202124]">Recommendation:</span> {issue.recommendation}
                      </p>
                    </div>
                  ))}

                  {/* Warnings */}
                  {warningIssues.map((issue) => (
                    <div key={issue.id} className="p-3 bg-[#fef7e0]/30 border border-[#feefc3] rounded-md space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#fef7e0] text-[#b06000] uppercase border border-[#feefc3]">
                          WARNING • {issue.category}
                        </span>
                        <span className="text-xs font-medium text-[#b06000] font-mono">{issue.code}</span>
                      </div>
                      <p className="text-xs font-medium text-[#202124]">{issue.message}</p>
                      <p className="text-[11px] text-[#5f6368] bg-white p-2 rounded border border-[#feefc3]/60">
                        💡 <span className="font-medium text-[#202124]">Recommendation:</span> {issue.recommendation}
                      </p>
                    </div>
                  ))}

                  {/* Notices */}
                  {noticeIssues.map((issue) => (
                    <div key={issue.id} className="p-3 bg-[#e8f0fe]/30 border border-[#d2e3fc] rounded-md space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#e8f0fe] text-[#1a73e8] uppercase border border-[#d2e3fc]">
                          NOTICE • {issue.category}
                        </span>
                        <span className="text-xs font-medium text-[#1a73e8] font-mono">{issue.code}</span>
                      </div>
                      <p className="text-xs font-medium text-[#202124]">{issue.message}</p>
                      <p className="text-[11px] text-[#5f6368] bg-white p-2 rounded border border-[#d2e3fc]/60">
                        💡 <span className="font-medium text-[#202124]">Recommendation:</span> {issue.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Fix Recommendations Preview */}
              {currentFixes && (
                <div className="p-4 bg-[#e8f0fe]/30 border border-[#d2e3fc] rounded-md space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#1a73e8]">
                      <Sparkles className="w-4 h-4 text-[#1a73e8]" />
                      Gemini AI Optimized Recommendations
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyFix}
                      className="px-2.5 py-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {applied ? <Check className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                      <span>{applied ? 'Applied!' : 'Apply Fixes'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="bg-white p-2.5 rounded border border-[#d2e3fc]">
                      <span className="text-[#5f6368] font-medium uppercase text-[10px]">Optimized Title: </span>
                      <div className="text-[#202124] font-medium">{currentFixes.optimizedTitle}</div>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-[#d2e3fc]">
                      <span className="text-[#5f6368] font-medium uppercase text-[10px]">Optimized Meta Description: </span>
                      <div className="text-[#3c4043]">{currentFixes.optimizedDescription}</div>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-[#d2e3fc]">
                      <span className="text-[#5f6368] font-medium uppercase text-[10px]">Canonical Tag: </span>
                      <div className="text-[#1a73e8]">{currentFixes.canonicalTag}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Live Raw HTML Source View */
            <div className="space-y-3">
              {htmlFixNotice && (
                <div className="p-3 bg-[#e6f4ea] border border-[#ceead6] rounded-md flex items-center justify-between gap-2 text-[#137333] text-xs font-medium animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#137333] shrink-0" />
                    <span>{htmlFixNotice}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8fafd] border border-[#dadce0] text-[#3c4043] p-2.5 rounded-md text-xs font-mono">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-[#5f6368]" />
                  <input
                    type="text"
                    placeholder="Search inside live HTML source..."
                    value={htmlSearch}
                    onChange={(e) => setHtmlSearch(e.target.value)}
                    className="bg-transparent border-0 focus:outline-none text-[#202124] text-xs w-full placeholder:text-[#5f6368]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFixSinglePageHtml}
                    disabled={isAutoFixingHtml}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded text-[11px] font-medium transition-all cursor-pointer"
                    title="Clean HTML, embed Schema, fix Title/Meta & H1 tags"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isAutoFixingHtml ? 'Fixing HTML...' : 'Auto-Fix HTML & Embed Schema'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-[#f1f3f4] text-[#3c4043] border border-[#dadce0] rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {copiedHtml ? <Check className="w-3 h-3 text-[#137333]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHtml ? 'Copied' : 'Copy HTML'}</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-md border border-[#dadce0] bg-[#202124] overflow-hidden">
                <div className="max-h-[500px] overflow-auto p-4 font-mono text-xs text-[#81c995] leading-relaxed whitespace-pre font-normal selection:bg-[#1a73e8] selection:text-white">
                  {rawHtmlText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-[#dadce0] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isAutoFixingHtml}
              onClick={handleAutoFixSinglePageHtml}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium transition-all disabled:opacity-60 cursor-pointer"
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f1f3f4] text-[#1a73e8] border border-[#dadce0] rounded-md text-xs font-medium transition-all cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f1f3f4] text-[#3c4043] border border-[#dadce0] rounded-md text-xs font-medium transition-all disabled:opacity-60 cursor-pointer"
            >
              {isFixing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#1a73e8]" />
                  <span>AI Suggestions</span>
                </>
              )}
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
