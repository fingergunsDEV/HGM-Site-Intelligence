'use client';

import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  FileCode2, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Filter, 
  ArrowUpDown,
  Sparkles,
  ShieldAlert,
  SlidersHorizontal,
  FileSpreadsheet,
  Code2,
  Globe
} from 'lucide-react';
import { PageMetadata, PageType } from '@/types/site-intelligence';

interface ResultsTableProps {
  pages: PageMetadata[];
  onOpenSchema: (page: PageMetadata) => void;
  onOpenAudit: (page: PageMetadata) => void;
  onOpenAiFix: (page: PageMetadata) => void;
  onOpenHtml?: (page: PageMetadata) => void;
  onOpenFixAll?: () => void;
}

export function ResultsTable({
  pages,
  onOpenSchema,
  onOpenAudit,
  onOpenAiFix,
  onOpenHtml,
  onOpenFixAll
}: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [issueFilter, setIssueFilter] = useState<'ALL' | 'ISSUES_ONLY' | 'CLEAN_ONLY'>('ALL');
  const [sortBy, setSortBy] = useState<'url' | 'issues' | 'words' | 'inlinks'>('issues');
  const [sortAsc, setSortAsc] = useState(false);

  const totalIssuesCount = pages.reduce((acc, p) => acc + p.issues.length, 0);
  const totalPagesWithIssues = pages.filter(p => p.issues.length > 0).length;


  // Filtering & Sorting
  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      searchTerm === '' ||
      page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || page.pageType === selectedType;

    const matchesIssue =
      issueFilter === 'ALL' ||
      (issueFilter === 'ISSUES_ONLY' && page.issues.length > 0) ||
      (issueFilter === 'CLEAN_ONLY' && page.issues.length === 0);

    return matchesSearch && matchesType && matchesIssue;
  });

  const sortedPages = [...filteredPages].sort((a, b) => {
    let result = 0;
    if (sortBy === 'url') {
      result = a.url.localeCompare(b.url);
    } else if (sortBy === 'issues') {
      result = (a.issues.length || 0) - (b.issues.length || 0);
    } else if (sortBy === 'words') {
      result = (a.wordCount || 0) - (b.wordCount || 0);
    } else if (sortBy === 'inlinks') {
      result = (a.inlinksCount || 0) - (b.inlinksCount || 0);
    }
    return sortAsc ? result : -result;
  });

  const toggleSort = (column: 'url' | 'issues' | 'words' | 'inlinks') => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(false);
    }
  };

  const getPageTypeBadge = (type: PageType) => {
    switch (type) {
      case 'TechArticle':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Service':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LocalBusiness':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FAQPage':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Product':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Organization':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Auto-Fix All Callout Banner if there are issues or onOpenFixAll is available */}
      {onOpenFixAll && (
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>Auto-Fix All Pages & Generate Clean HTML</span>
                {totalIssuesCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    {totalIssuesCount} Issues Detected ({totalPagesWithIssues} Pages)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    ✓ All Clean & Validated
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                Fix all SEO audit errors, enforce single H1, restore image alt tags, embed Schema.org JSON-LD, and generate full production-ready HTML for every page in your sitemap.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenFixAll}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Fix All Pages & Download HTML</span>
          </button>
        </div>
      )}

      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">

        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by URL or title..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Schema Types</option>
            <option value="TechArticle">TechArticle</option>
            <option value="Service">Service</option>
            <option value="FAQPage">FAQPage</option>
            <option value="LocalBusiness">LocalBusiness</option>
            <option value="Product">Product</option>
            <option value="Organization">Organization</option>
            <option value="WebPage">WebPage</option>
          </select>

          {/* Issue Filter */}
          <select
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Pages</option>
            <option value="ISSUES_ONLY">Pages with SEO Issues</option>
            <option value="CLEAN_ONLY">Clean (0 Issues)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-800">{sortedPages.length}</span> of {pages.length} pages
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px] font-mono">
              <th className="py-3 px-4">Status</th>
              <th 
                onClick={() => toggleSort('url')} 
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center gap-1">
                  URL & Page Title
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Schema Type</th>
              <th 
                onClick={() => toggleSort('issues')} 
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  SEO Audit
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('inlinks')} 
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none text-center hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-1">
                  Inlinks / Outlinks
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('words')} 
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none text-right hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  Words
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {sortedPages.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                  No pages matching the current filters.
                </td>
              </tr>
            ) : (
              sortedPages.map((page) => {
                const criticalCount = page.issues.filter(i => i.type === 'critical').length;
                const warnCount = page.issues.filter(i => i.type === 'warning').length;

                return (
                  <tr key={page.url} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Status Code */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                        {page.statusCode || 200} OK
                      </span>
                    </td>

                    {/* URL & Title */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md lg:max-w-lg">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 truncate">
                        <span className="truncate">{page.title || 'Untitled WebPage'}</span>
                        {page.isLiveFetched ? (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            LIVE
                          </span>
                        ) : null}
                      </div>
                      <div className="text-slate-500 text-xs font-mono truncate flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{page.url}</span>
                        {page.htmlSizeBytes ? (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            ({(page.htmlSizeBytes / 1024).toFixed(1)} KB)
                          </span>
                        ) : null}
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      </div>
                    </td>

                    {/* Schema Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${getPageTypeBadge(page.pageType)}`}>
                        {page.pageType}
                      </span>
                    </td>

                    {/* SEO Issues */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      {page.issues.length === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Passed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenAudit(page)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>{page.issues.length} {page.issues.length === 1 ? 'issue' : 'issues'}</span>
                          {criticalCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Link Graph Metrics */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center hidden md:table-cell font-mono text-xs">
                      <span className="text-indigo-600 font-bold">{page.inlinksCount || 0} in</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span className="text-slate-600">{page.outlinksCount || page.extractedLinks?.length || 0} out</span>
                    </td>

                    {/* Word Count */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right hidden lg:table-cell font-mono text-xs text-slate-600">
                      {page.wordCount?.toLocaleString() || 0} w
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenHtml && (
                          <button
                            type="button"
                            onClick={() => onOpenHtml(page)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Inspect & Copy Clean HTML"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenSchema(page)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="View & validate JSON-LD schema"
                        >
                          <FileCode2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenAudit(page)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="View detailed SEO audit"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenAiFix(page)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="AI Metadata & Schema Fix"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
