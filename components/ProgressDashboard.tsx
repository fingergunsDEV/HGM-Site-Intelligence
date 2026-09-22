'use client';

import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Network, 
  FileCode, 
  Sparkles, 
  Globe2,
  Clock,
  Gauge
} from 'lucide-react';
import { CrawlSummary } from '@/types/site-intelligence';

interface ProgressDashboardProps {
  summary: CrawlSummary;
}

export function ProgressDashboard({ summary }: ProgressDashboardProps) {
  const isRunning = summary.status === 'running';

  return (
    <div className="space-y-4">
      {/* Live Crawl Progress Bar */}
      <div className="bg-white rounded-lg border border-[#dadce0] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-[#1a73e8] animate-pulse' : summary.status === 'done' ? 'bg-[#1e8e3e]' : 'bg-[#9aa0a6]'}`}></span>
            <span className="text-xs sm:text-sm font-medium text-[#202124]">
              {summary.status === 'running' ? 'Crawler in progress' : summary.status === 'done' ? 'Crawl completed' : 'Engine ready'}
            </span>
            <span className="text-xs text-[#5f6368]">
              ({summary.crawledPages} / {summary.totalPages || summary.crawledPages} URLs)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#5f6368]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#5f6368]" />
              {summary.elapsedSeconds}s elapsed
            </span>
            <span className="flex items-center gap-1 font-medium text-[#1a73e8]">
              <Gauge className="w-3.5 h-3.5 text-[#1a73e8]" />
              {summary.percent}%
            </span>
          </div>
        </div>

        {/* Progress bar container */}
        <div className="w-full bg-[#e8eaed] rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#1a73e8] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(summary.percent, 0)}%` }}
          />
        </div>

        {/* Active URL status ticker */}
        {summary.currentUrl && isRunning && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#3c4043] bg-[#f8fafd] px-3 py-1.5 rounded border border-[#dadce0] font-mono truncate">
            <span className="text-[10px] uppercase font-medium text-[#1a73e8] bg-[#e8f0fe] px-1.5 py-0.5 rounded">
              FETCHING
            </span>
            <span className="truncate">{summary.currentUrl}</span>
          </div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pages Crawled */}
        <div className="bg-white rounded-lg border border-[#dadce0] p-3.5 hover:border-[#bdc1c6] transition-colors">
          <div className="flex items-center justify-between text-[#5f6368] mb-1">
            <span className="text-[11px] font-medium">Crawled URLs</span>
            <Globe2 className="w-4 h-4 text-[#1a73e8]" />
          </div>
          <div className="text-xl font-normal text-[#202124]">
            {summary.crawledPages}
          </div>
          <div className="text-[11px] text-[#5f6368] mt-0.5">
            200 OK responses
          </div>
        </div>

        {/* Critical Issues */}
        <div className="bg-white rounded-lg border border-[#dadce0] p-3.5 hover:border-[#bdc1c6] transition-colors">
          <div className="flex items-center justify-between text-[#d93025] mb-1">
            <span className="text-[11px] font-medium">Critical Errors</span>
            <AlertOctagon className="w-4 h-4 text-[#d93025]" />
          </div>
          <div className="text-xl font-normal text-[#d93025]">
            {summary.criticalIssuesCount}
          </div>
          <div className="text-[11px] text-[#5f6368] mt-0.5">
            Missing title / H1 / meta
          </div>
        </div>

        {/* Warnings & Notices */}
        <div className="bg-white rounded-lg border border-[#dadce0] p-3.5 hover:border-[#bdc1c6] transition-colors">
          <div className="flex items-center justify-between text-[#b06000] mb-1">
            <span className="text-[11px] font-medium">Audit Warnings</span>
            <AlertTriangle className="w-4 h-4 text-[#b06000]" />
          </div>
          <div className="text-xl font-normal text-[#b06000]">
            {summary.warningIssuesCount + summary.noticeIssuesCount}
          </div>
          <div className="text-[11px] text-[#5f6368] mt-0.5">
            Length & alt tag alerts
          </div>
        </div>

        {/* Link Graph Edges */}
        <div className="bg-white rounded-lg border border-[#dadce0] p-3.5 hover:border-[#bdc1c6] transition-colors">
          <div className="flex items-center justify-between text-[#5f6368] mb-1">
            <span className="text-[11px] font-medium">Internal Links</span>
            <Network className="w-4 h-4 text-[#1a73e8]" />
          </div>
          <div className="text-xl font-normal text-[#202124]">
            {summary.totalLinksFound}
          </div>
          <div className="text-[11px] text-[#5f6368] mt-0.5">
            Directed graph edges
          </div>
        </div>

        {/* Schemas Generated */}
        <div className="bg-white rounded-lg border border-[#dadce0] p-3.5 hover:border-[#bdc1c6] transition-colors">
          <div className="flex items-center justify-between text-[#5f6368] mb-1">
            <span className="text-[11px] font-medium">Schemas Built</span>
            <FileCode className="w-4 h-4 text-[#1e8e3e]" />
          </div>
          <div className="text-xl font-normal text-[#202124]">
            {summary.schemasGeneratedCount}
          </div>
          <div className="text-[11px] text-[#137333] mt-0.5">
            JSON-LD Validated
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="bg-white rounded-lg border border-[#dadce0] p-3.5 hover:border-[#bdc1c6] transition-colors">
          <div className="flex items-center justify-between text-[#1a73e8] mb-1">
            <span className="text-[11px] font-medium">AI Link Opps</span>
            <Sparkles className="w-4 h-4 text-[#1a73e8]" />
          </div>
          <div className="text-xl font-normal text-[#1a73e8]">
            {summary.aiSuggestionsCount}
          </div>
          <div className="text-[11px] text-[#5f6368] mt-0.5">
            Semantic cluster links
          </div>
        </div>
      </div>
    </div>
  );
}
