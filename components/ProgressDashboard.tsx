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
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-indigo-600 animate-pulse' : summary.status === 'done' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
              {summary.status === 'running' ? 'CRAWLER IN PROGRESS' : summary.status === 'done' ? 'CRAWL COMPLETED' : 'ENGINE READY'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({summary.crawledPages} / {summary.totalPages || summary.crawledPages} URLs)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {summary.elapsedSeconds}s elapsed
            </span>
            <span className="flex items-center gap-1 font-bold text-indigo-600">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              {summary.percent}%
            </span>
          </div>
        </div>

        {/* Progress bar container */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(summary.percent, 0)}%` }}
          />
        </div>

        {/* Active URL status ticker */}
        {summary.currentUrl && isRunning && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 font-mono truncate">
            <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
              FETCHING
            </span>
            <span className="truncate">{summary.currentUrl}</span>
          </div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pages Crawled */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Crawled URLs</span>
            <Globe2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {summary.crawledPages}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            200 OK responses
          </div>
        </div>

        {/* Critical Issues */}
        <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-semibold">Critical Errors</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700">
            {summary.criticalIssuesCount}
          </div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">
            Missing title / H1 / meta
          </div>
        </div>

        {/* Warnings & Notices */}
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-semibold">Audit Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700">
            {summary.warningIssuesCount + summary.noticeIssuesCount}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">
            Length & alt tag alerts
          </div>
        </div>

        {/* Link Graph Edges */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Internal Links</span>
            <Network className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {summary.totalLinksFound}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Directed graph edges
          </div>
        </div>

        {/* Schemas Generated */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Schemas Built</span>
            <FileCode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {summary.schemasGeneratedCount}
          </div>
          <div className="text-[10px] text-emerald-600/90 mt-0.5">
            JSON-LD Validated
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="bg-white rounded-xl border border-indigo-200 bg-indigo-50/20 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-[11px] font-semibold">AI Link Opps</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-700">
            {summary.aiSuggestionsCount}
          </div>
          <div className="text-[10px] text-indigo-500/80 mt-0.5">
            Semantic cluster links
          </div>
        </div>
      </div>
    </div>
  );
}
