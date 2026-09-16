'use client';

import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FileSpreadsheet, 
  Sparkles, 
  Archive,
  Lock,
  Crown,
  Zap,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { CrawlSummary } from '@/types/site-intelligence';
import { UserAccount } from '@/types/auth';
import { 
  canUserRunCrawl, 
  canUserExportData, 
  isOwnerUser, 
  isBetaTesterUser 
} from '@/lib/auth-storage';

interface ControlBarProps {
  summary: CrawlSummary;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onDownloadZip: () => void;
  onDownloadCsv: () => void;
  onOpenFixAll?: () => void;
  hasResults: boolean;
  user: UserAccount | null;
  onOpenSubscriptionModal: (reason: 'export' | 'limit' | 'copy' | 'general') => void;
  onOpenAuthModal: () => void;
}

export function ControlBar({
  summary,
  onStart,
  onPause,
  onResume,
  onReset,
  onDownloadZip,
  onDownloadCsv,
  onOpenFixAll,
  hasResults,
  user,
  onOpenSubscriptionModal,
  onOpenAuthModal
}: ControlBarProps) {
  const isRunning = summary.status === 'running';
  const isPaused = summary.status === 'paused';
  const isSuperAdmin = isOwnerUser(user);
  const isTestUser = isBetaTesterUser(user);
  
  const crawlCheck = canUserRunCrawl(user);
  const canExport = canUserExportData(user);

  const handleStartClick = () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    if (!crawlCheck.allowed) {
      onOpenSubscriptionModal('limit');
      return;
    }
    onStart();
  };

  const handleExportCsvClick = () => {
    if (!canExport) {
      onOpenSubscriptionModal('export');
      return;
    }
    onDownloadCsv();
  };

  const handleExportZipClick = () => {
    if (!canExport) {
      onOpenSubscriptionModal('export');
      return;
    }
    onDownloadZip();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Left Primary Actions & Quota Indicator */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!isRunning && !isPaused && (
          <button
            type="button"
            onClick={handleStartClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer ${
              !crawlCheck.allowed
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {!crawlCheck.allowed ? (
              <>
                <CreditCard className="w-4 h-4 text-slate-950" />
                <span>Add $1 to Crawl</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Crawl Engine</span>
              </>
            )}
          </button>
        )}

        {isRunning && (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
            <span>Pause Crawl</span>
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume Crawl</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          title="Clear all logs and reset metrics"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {/* Pricing / Quota Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
          {isSuperAdmin ? (
            <span className="flex items-center gap-1.5 text-amber-700 font-bold">
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Super Admin: Full Access
            </span>
          ) : isTestUser ? (
            <span className="flex items-center gap-1.5 text-cyan-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              Test Allocation: {user?.crawlsRunCount || 0}/{user?.testerPermissions?.allowedCrawls ?? 5} crawls used
            </span>
          ) : user ? (
            user.crawlsRunCount === 0 ? (
              <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>1 Free Crawl Available (Exports locked on free crawl)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 font-mono">${(user.balance ?? 0).toFixed(2)}</span>
                <span className="text-slate-500 font-mono">balance • $1/crawl • $3/adv run</span>
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-indigo-700">
              <Zap className="w-3.5 h-3.5" />
              1 Free Crawl Available for new users
            </span>
          )}
        </div>
      </div>

      {/* Right Download / Export Actions with Pricing Lock */}
      <div className="flex items-center gap-2">
        {hasResults && (
          <>
            {onOpenFixAll && (
              <button
                type="button"
                onClick={onOpenFixAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Auto-fix all SEO violations and generate complete clean HTML files ($3/run or free for Super Admin)"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fix All & Clean HTML</span>
                {!isSuperAdmin && !user?.testerPermissions?.canUseAdvanced && (
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-700/50">
                    $3/run
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsvClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs ${
                canExport 
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
              }`}
              title={canExport ? 'Download full audit report as CSV' : 'Exports are not available on free crawl ($1/crawl required)'}
            >
              {!canExport ? (
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Export CSV</span>
              {!canExport && (
                <span className="px-1.5 py-0.2 rounded bg-amber-200/70 text-amber-900 text-[10px] font-bold">
                  Locked
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportZipClick}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
                canExport
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
              }`}
              title={canExport ? 'Download complete ZIP with all JSON-LD schemas' : 'Exports are not available on free crawl ($1/crawl required)'}
            >
              {!canExport ? (
                <Lock className="w-3.5 h-3.5 text-slate-950" />
              ) : (
                <Archive className="w-3.5 h-3.5 text-cyan-300" />
              )}
              <span>Download ZIP</span>
              {!canExport && (
                <span className="px-1.5 py-0.2 rounded bg-slate-950 text-white text-[10px] font-bold">
                  Locked
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
