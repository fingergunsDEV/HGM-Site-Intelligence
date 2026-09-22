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
    <div className="bg-white rounded-lg border border-[#dadce0] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
      {/* Left Primary Actions & Quota Indicator */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!isRunning && !isPaused && (
          <button
            type="button"
            onClick={handleStartClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              !crawlCheck.allowed
                ? 'bg-[#f2994a] hover:bg-[#e0893b] text-white'
                : 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
            }`}
          >
            {!crawlCheck.allowed ? (
              <>
                <CreditCard className="w-4 h-4 text-white" />
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
            className="flex items-center gap-2 px-4 py-2 bg-[#ea8600] hover:bg-[#d47800] text-white rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
            <span>Pause Crawl</span>
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e8e3e] hover:bg-[#137333] text-white rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume Crawl</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-md text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
          title="Clear all logs and reset metrics"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {/* Pricing / Quota Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#f8fafd] border border-[#dadce0] text-xs text-[#5f6368]">
          {isSuperAdmin ? (
            <span className="flex items-center gap-1.5 text-[#b06000] font-medium">
              <Crown className="w-3.5 h-3.5 text-[#b06000] fill-[#b06000]" />
              Super Admin: Full Access
            </span>
          ) : isTestUser ? (
            <span className="flex items-center gap-1.5 text-[#1967d2] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1a73e8]" />
              Test Allocation: {user?.crawlsRunCount || 0}/{user?.testerPermissions?.allowedCrawls ?? 5} crawls used
            </span>
          ) : user ? (
            user.crawlsRunCount === 0 ? (
              <span className="flex items-center gap-1.5 text-[#1967d2] font-medium">
                <Zap className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>1 Free Crawl Available (Exports locked on free crawl)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-[#202124]">${(user.balance ?? 0).toFixed(2)}</span>
                <span className="text-[#5f6368]">balance • $1/crawl • $3/adv run</span>
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-[#1967d2] font-medium">
              <Zap className="w-3.5 h-3.5 text-[#1a73e8]" />
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1967d2] border border-[#d2e3fc] rounded-md text-xs font-medium transition-colors cursor-pointer"
                title="Auto-fix all SEO violations and generate complete clean HTML files"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>Fix All & Clean HTML</span>
                {!isSuperAdmin && !user?.testerPermissions?.canUseAdvanced && (
                  <span className="px-1.5 py-0.2 rounded bg-white text-[#1967d2] text-[10px] font-medium border border-[#d2e3fc]">
                    $3/run
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsvClick}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-xs font-medium transition-colors cursor-pointer ${
                canExport 
                  ? 'bg-white hover:bg-[#f8fafd] border-[#dadce0] text-[#3c4043]'
                  : 'bg-[#fef7e0] hover:bg-[#feefc3] border-[#feefc3] text-[#b06000]'
              }`}
              title={canExport ? 'Download full audit report as CSV' : 'Exports are not available on free crawl ($1/crawl required)'}
            >
              {!canExport ? (
                <Lock className="w-3.5 h-3.5 text-[#b06000]" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#1e8e3e]" />
              )}
              <span>Export CSV</span>
              {!canExport && (
                <span className="px-1.5 py-0.2 rounded bg-[#feefc3] text-[#b06000] text-[10px] font-medium">
                  Locked
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportZipClick}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                canExport
                  ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
                  : 'bg-[#fef7e0] hover:bg-[#feefc3] text-[#b06000] border border-[#feefc3]'
              }`}
              title={canExport ? 'Download complete ZIP with all JSON-LD schemas' : 'Exports are not available on free crawl ($1/crawl required)'}
            >
              {!canExport ? (
                <Lock className="w-3.5 h-3.5 text-[#b06000]" />
              ) : (
                <Archive className="w-3.5 h-3.5 text-white" />
              )}
              <span>Download ZIP</span>
              {!canExport && (
                <span className="px-1.5 py-0.2 rounded bg-[#feefc3] text-[#b06000] text-[10px] font-medium">
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
