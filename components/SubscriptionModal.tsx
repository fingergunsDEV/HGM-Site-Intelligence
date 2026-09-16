'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Download, 
  Crown,
  Coins,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserAccount } from '@/types/auth';
import { 
  addAccountCredits, 
  upgradeUserToPro, 
  isOwnerUser, 
  isBetaTesterUser 
} from '@/lib/auth-storage';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onUpdateUser: (user: UserAccount) => void;
  onRequireAuth?: () => void;
  triggerReason?: 'export' | 'limit' | 'copy' | 'advanced' | 'general';
  featureName?: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onRequireAuth,
  triggerReason = 'general',
  featureName = 'Advanced Feature'
}: SubscriptionModalProps) {
  const [selectedPack, setSelectedPack] = useState<number>(5); // $5 default
  const [isProcessing, setIsProcessing] = useState(false);
  const [customCard, setCustomCard] = useState('4242 •••• •••• 4242');

  if (!isOpen) return null;

  const isSuperAdmin = isOwnerUser(user);
  const isTestUser = isBetaTesterUser(user);
  const balance = user?.balance || 0;
  const crawlsUsed = user?.crawlsUsed || 0;

  const handleAddCredits = (amountDollars: number) => {
    if (!user) {
      if (onRequireAuth) {
        onClose();
        onRequireAuth();
      }
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      let updated: UserAccount;
      if (amountDollars >= 20) {
        updated = upgradeUserToPro(user);
      } else {
        updated = addAccountCredits(user, amountDollars);
      }
      setIsProcessing(false);
      onUpdateUser(updated);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
      onClose();
    }, 500);
  };

  const getTriggerTitle = () => {
    switch (triggerReason) {
      case 'export':
        return 'Data Exports Require Account Balance';
      case 'limit':
        return 'Free Crawl Completed ($1/crawl thereafter)';
      case 'advanced':
        return `${featureName} Costs $3/Run`;
      case 'copy':
        return 'Protected Dataset — Unlock with Account Balance';
      default:
        return 'Site Intelligence Pricing & Credits';
    }
  };

  const getTriggerNotice = () => {
    switch (triggerReason) {
      case 'export':
        return 'CSV and Clean HTML ZIP exports are disabled on the 1 free crawl. Add any credit balance ($1+ or credit pack) to download.';
      case 'copy':
        return 'Clipboard copying and right-click inspection are restricted on free test crawls. Add balance or subscribe to unlock.';
      case 'limit':
        return 'You have used your 1 free live crawl. Additional crawls cost $1 each. Add balance below to continue crawling.';
      case 'advanced':
        return `${featureName} is an Advanced Remediation feature that costs $3 per run. Top up your balance or subscribe.`;
      default:
        return '1 free crawl is included. Additional crawls cost $1 each, and advanced remediation features cost $3 per run.';
    }
  };

  return (
    <div 
      id="subscription-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="subscription-modal-container"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto flex flex-col relative text-slate-900"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-slate-950 p-6 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-cyan-400" />
              Pay-As-You-Go Pricing
            </span>
            {user && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Balance: <strong className="text-white">${balance.toFixed(2)}</strong>
              </span>
            )}
          </div>

          <div className="mt-3">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {getTriggerTitle()}
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {getTriggerNotice()}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* If Super Admin */}
          {isSuperAdmin ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Super Admin VIP Status Active</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Logged in as Super Admin (<strong>{user?.email}</strong>). You have unrestricted, zero-cost access to all crawls, remediation engines, and exports. You can also add and configure limited test user permissions from the top bar.
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : isTestUser ? (
            /* If Test User */
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Test User Account Active</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                You are authenticated as an authorized Test User (<strong>{user?.email}</strong>).
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block">Crawl Allowance:</span>
                  <span className="font-bold text-emerald-950 font-mono">
                    {crawlsUsed} / {user?.testPermissions?.allowedCrawls ?? 5} crawls used
                  </span>
                </div>
                <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block">Exports Allowed:</span>
                  <span className="font-bold text-emerald-950 font-mono">
                    {user?.testPermissions?.canExport ? 'Yes (Unlocked)' : 'No (Locked)'}
                  </span>
                </div>
                <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block">Advanced Features:</span>
                  <span className="font-bold text-emerald-950 font-mono">
                    {user?.testPermissions?.canUseAdvanced ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block">Codebase IDE:</span>
                  <span className="font-bold text-emerald-950 font-mono">
                    {user?.testPermissions?.canAccessCodebase ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Pricing Model Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Free Crawl */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>1 Free Crawl</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-200 rounded text-slate-800 font-bold">$0</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1 Full Sitemap Crawl</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>No CSV/ZIP exports</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Copy & Right-click locked</span>
                </li>
              </ul>
            </div>

            {/* Pay-Per-Crawl */}
            <div className="p-3.5 rounded-xl border-2 border-cyan-500 bg-cyan-50/30 space-y-2 relative">
              <div className="absolute -top-2 right-2 px-1.5 py-0.5 bg-cyan-600 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                Standard
              </div>
              <div className="font-bold text-cyan-950 flex items-center justify-between">
                <span>Per Crawl</span>
                <span className="font-mono text-xs text-cyan-700 font-bold">$1 / crawl</span>
              </div>
              <ul className="space-y-1.5 text-cyan-950 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>Unrestricted Crawling</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>CSV Export Unlocked</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>Full Copy & Selection</span>
                </li>
              </ul>
            </div>

            {/* Advanced Runs */}
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
              <div className="font-bold text-indigo-950 flex items-center justify-between">
                <span>Advanced Features</span>
                <span className="font-mono text-xs text-indigo-700 font-bold">$3 / run</span>
              </div>
              <ul className="space-y-1.5 text-indigo-950 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Auto-Fix All Engine</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Gemini AI Suggestions</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Clean HTML ZIP Export</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Add Balance Options */}
          {!isSuperAdmin && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-cyan-600" />
                  <span>Select Credit Top-Up</span>
                </h4>
                <span className="text-[11px] text-slate-500">Credits never expire</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* $1 Instant Crawl */}
                <button
                  type="button"
                  onClick={() => setSelectedPack(1)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPack === 1 
                      ? 'border-cyan-600 bg-cyan-50/70 ring-1 ring-cyan-600 shadow-xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">$1</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">1 Crawl</div>
                </button>

                {/* $3 Single Advanced Run */}
                <button
                  type="button"
                  onClick={() => setSelectedPack(3)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPack === 3 
                      ? 'border-cyan-600 bg-cyan-50/70 ring-1 ring-cyan-600 shadow-xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">$3</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">1 Adv. Run</div>
                </button>

                {/* $5 Popular Pack */}
                <button
                  type="button"
                  onClick={() => setSelectedPack(5)}
                  className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                    selectedPack === 5 
                      ? 'border-cyan-600 bg-cyan-50/70 ring-1 ring-cyan-600 shadow-xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="absolute -top-2 right-2 px-1 py-0.2 bg-cyan-600 text-white rounded text-[8px] font-bold">BEST</span>
                  <div className="text-xs font-bold text-slate-900">$5</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">5 Crawls / Mix</div>
                </button>

                {/* $20 Pro Pack */}
                <button
                  type="button"
                  onClick={() => setSelectedPack(20)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPack === 20 
                      ? 'border-cyan-600 bg-cyan-50/70 ring-1 ring-cyan-600 shadow-xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">$20</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">Pro Unlimited</div>
                </button>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleAddCredits(selectedPack)}
                className="w-full mt-2 py-3 bg-gradient-to-r from-slate-900 to-cyan-950 hover:from-slate-800 hover:to-cyan-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing instant credit authorization...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    <span>
                      Add ${selectedPack}.00 Balance & Unlock {triggerReason === 'export' ? 'Data Exports' : triggerReason === 'advanced' ? 'Advanced Run' : 'Instant Crawling'}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Instant Test Checkout
                </span>
                <span>•</span>
                <span>Pay-As-You-Go ($1/crawl, $3/adv run)</span>
              </div>
            </div>
          )}

          {/* Development Notice for ACE Orchestrator */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Notice regarding ACE Orchestrator:</strong> The ACE cognitive architecture is undergoing benchmarking and remains inaccessible until dedicated compute pricing is calibrated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
