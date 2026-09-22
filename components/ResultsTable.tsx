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
        return 'bg-[#f3e8fd] text-[#7627bb] border-[#e9d5ff]';
      case 'Service':
        return 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]';
      case 'LocalBusiness':
        return 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]';
      case 'FAQPage':
        return 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]';
      case 'Product':
        return 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]';
      case 'Organization':
        return 'bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc]';
      default:
        return 'bg-[#f1f3f4] text-[#3c4043] border-[#dadce0]';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden">
      {/* Auto-Fix All Callout Banner */}
      {onOpenFixAll && (
        <div className="p-3.5 sm:p-4 bg-[#f8fafd] text-[#202124] flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#1a73e8]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-medium text-[#202124] flex items-center gap-2">
                <span>Auto-Fix All Pages & Generate Clean HTML</span>
                {totalIssuesCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fef7e0] text-[#b06000] border border-[#feefc3]">
                    {totalIssuesCount} Issues Detected ({totalPagesWithIssues} Pages)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                    ✓ All Clean & Validated
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5f6368]">
                Fix all SEO audit errors, enforce single H1, restore image alt tags, embed Schema.org JSON-LD, and generate full production-ready HTML for every page in your sitemap.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenFixAll}
            className="px-3.5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Fix All Pages & Download HTML</span>
          </button>
        </div>
      )}

      {/* Table Toolbar */}
      <div className="p-3 sm:p-4 border-b border-[#dadce0] bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-[#5f6368] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by URL or title..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#dadce0] rounded-md text-xs sm:text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#dadce0] rounded-md text-xs font-medium text-[#3c4043] focus:outline-none focus:border-[#1a73e8] cursor-pointer"
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
            className="px-3 py-1.5 bg-white border border-[#dadce0] rounded-md text-xs font-medium text-[#3c4043] focus:outline-none focus:border-[#1a73e8] cursor-pointer"
          >
            <option value="ALL">All Pages</option>
            <option value="ISSUES_ONLY">Pages with SEO Issues</option>
            <option value="CLEAN_ONLY">Clean (0 Issues)</option>
          </select>
        </div>

        <div className="text-xs text-[#5f6368]">
          Showing <span className="font-medium text-[#202124]">{sortedPages.length}</span> of {pages.length} pages
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#dadce0] bg-[#f8fafd] text-[#5f6368] font-medium text-[11px]">
              <th className="py-3 px-4">Status</th>
              <th 
                onClick={() => toggleSort('url')} 
                className="py-3 px-4 cursor-pointer hover:text-[#202124] select-none"
              >
                <div className="flex items-center gap-1">
                  URL & Page Title
                  <ArrowUpDown className="w-3 h-3 text-[#5f6368]" />
                </div>
              </th>
              <th className="py-3 px-4">Schema Type</th>
              <th 
                onClick={() => toggleSort('issues')} 
                className="py-3 px-4 cursor-pointer hover:text-[#202124] select-none text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  SEO Audit
                  <ArrowUpDown className="w-3 h-3 text-[#5f6368]" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('inlinks')} 
                className="py-3 px-4 cursor-pointer hover:text-[#202124] select-none text-center hidden md:table-cell"
              >
                <div className="flex items-center justify-center gap-1">
                  Inlinks / Outlinks
                  <ArrowUpDown className="w-3 h-3 text-[#5f6368]" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('words')} 
                className="py-3 px-4 cursor-pointer hover:text-[#202124] select-none text-right hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  Words
                  <ArrowUpDown className="w-3 h-3 text-[#5f6368]" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f3f4]">
            {sortedPages.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#5f6368] italic">
                  No pages matching the current filters.
                </td>
              </tr>
            ) : (
              sortedPages.map((page) => {
                const criticalCount = page.issues.filter(i => i.type === 'critical').length;
                const warnCount = page.issues.filter(i => i.type === 'warning').length;

                return (
                  <tr key={page.url} className="hover:bg-[#f8fafd] transition-colors group">
                    {/* Status Code */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                        {page.statusCode || 200} OK
                      </span>
                    </td>

                    {/* URL & Title */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md lg:max-w-lg">
                      <div className="flex items-center gap-1.5 font-medium text-[#202124] truncate">
                        <span className="truncate">{page.title || 'Untitled WebPage'}</span>
                        {page.isLiveFetched ? (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                            LIVE
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[#5f6368] text-xs truncate flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{page.url}</span>
                        {page.htmlSizeBytes ? (
                          <span className="text-[10px] text-[#80868b] shrink-0">
                            ({(page.htmlSizeBytes / 1024).toFixed(1)} KB)
                          </span>
                        ) : null}
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#5f6368] hover:text-[#1a73e8] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      </div>
                    </td>

                    {/* Schema Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${getPageTypeBadge(page.pageType)}`}>
                        {page.pageType}
                      </span>
                    </td>

                    {/* SEO Issues */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      {page.issues.length === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                          <CheckCircle2 className="w-3 h-3" />
                          Passed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenAudit(page)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf] hover:bg-[#fad2cf] transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-[#c5221f]" />
                          <span>{page.issues.length} {page.issues.length === 1 ? 'issue' : 'issues'}</span>
                          {criticalCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-[#d93025]"></span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Link Graph Metrics */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center hidden md:table-cell text-xs">
                      <span className="text-[#1a73e8] font-medium">{page.inlinksCount || 0} in</span>
                      <span className="text-[#dadce0] mx-1">/</span>
                      <span className="text-[#5f6368]">{page.outlinksCount || page.extractedLinks?.length || 0} out</span>
                    </td>

                    {/* Word Count */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right hidden lg:table-cell text-xs text-[#5f6368]">
                      {page.wordCount?.toLocaleString() || 0} w
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onOpenHtml && (
                          <button
                            type="button"
                            onClick={() => onOpenHtml(page)}
                            className="p-1.5 text-[#5f6368] hover:text-[#1e8e3e] hover:bg-[#f1f3f4] border border-[#dadce0] rounded-md text-xs font-medium transition-colors cursor-pointer"
                            title="Inspect & Copy Clean HTML"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenSchema(page)}
                          className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f1f3f4] border border-[#dadce0] rounded-md text-xs font-medium transition-colors cursor-pointer"
                          title="View & validate JSON-LD schema"
                        >
                          <FileCode2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenAudit(page)}
                          className="p-1.5 text-[#5f6368] hover:text-[#b06000] hover:bg-[#f1f3f4] border border-[#dadce0] rounded-md text-xs font-medium transition-colors cursor-pointer"
                          title="View detailed SEO audit"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenAiFix(page)}
                          className="p-1.5 text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe] border border-[#dadce0] rounded-md text-xs font-medium transition-colors cursor-pointer"
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
