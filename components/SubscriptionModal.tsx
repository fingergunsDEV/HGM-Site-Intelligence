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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="subscription-modal-container"
        className="bg-white rounded-lg border border-[#dadce0] shadow-xl w-full max-w-xl max-h-[92vh] overflow-y-auto flex flex-col relative text-[#202124]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-md text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-white p-6 text-[#202124] border-b border-[#dadce0]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] uppercase tracking-wider">
              <Coins className="w-3 h-3 text-[#1a73e8]" />
              Pay-As-You-Go Pricing
            </span>
            {user && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#f1f3f4] border border-[#dadce0] text-[#3c4043]">
                Balance: <strong className="text-[#202124]">${balance.toFixed(2)}</strong>
              </span>
            )}
          </div>

          <div className="mt-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-[#202124]">
              {getTriggerTitle()}
            </h2>
            <p className="text-xs text-[#5f6368] mt-1 leading-relaxed">
              {getTriggerNotice()}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* If Super Admin */}
          {isSuperAdmin ? (
            <div className="p-4 bg-[#fef7e0] border border-[#fce8b2] rounded-md space-y-2 text-xs">
              <div className="flex items-center gap-2 font-medium text-[#b06000]">
                <Crown className="w-4 h-4 text-[#b06000]" />
                <span>Super Admin VIP Status Active</span>
              </div>
              <p className="text-[#3c4043] leading-relaxed">
                Logged in as Super Admin (<strong>{user?.email}</strong>). You have unrestricted, zero-cost access to all crawls, remediation engines, and exports. You can also add and configure limited test user permissions from the top bar.
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-[#b06000] hover:bg-[#8f4e00] text-white rounded-md font-medium text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : isTestUser ? (
            /* If Test User */
            <div className="p-4 bg-[#e6f4ea] border border-[#ceead6] rounded-md space-y-2 text-xs">
              <div className="flex items-center gap-2 font-medium text-[#137333]">
                <Sparkles className="w-4 h-4 text-[#137333]" />
                <span>Test User Account Active</span>
              </div>
              <p className="text-[#3c4043] leading-relaxed">
                You are authenticated as an authorized Test User (<strong>{user?.email}</strong>).
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 bg-white rounded-md border border-[#ceead6]">
                  <span className="text-[#5f6368] block">Crawl Allowance:</span>
                  <span className="font-medium text-[#202124] font-mono">
                    {crawlsUsed} / {user?.testPermissions?.allowedCrawls ?? 5} crawls used
                  </span>
                </div>
                <div className="p-2 bg-white rounded-md border border-[#ceead6]">
                  <span className="text-[#5f6368] block">Exports Allowed:</span>
                  <span className="font-medium text-[#202124] font-mono">
                    {user?.testPermissions?.canExport ? 'Yes (Unlocked)' : 'No (Locked)'}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-md border border-[#ceead6]">
                  <span className="text-[#5f6368] block">Advanced Features:</span>
                  <span className="font-medium text-[#202124] font-mono">
                    {user?.testPermissions?.canUseAdvanced ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-md border border-[#ceead6]">
                  <span className="text-[#5f6368] block">Codebase IDE:</span>
                  <span className="font-medium text-[#202124] font-mono">
                    {user?.testPermissions?.canAccessCodebase ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Pricing Model Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Free Crawl */}
            <div className="p-3.5 rounded-md border border-[#dadce0] bg-[#f8fafd] space-y-2">
              <div className="font-medium text-[#202124] flex items-center justify-between">
                <span>1 Free Crawl</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#f1f3f4] rounded text-[#3c4043] font-medium">$0</span>
              </div>
              <ul className="space-y-1.5 text-[#5f6368] text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
                  <span>1 Full Sitemap Crawl</span>
                </li>
                <li className="flex items-center gap-1.5 text-[#5f6368]">
                  <Lock className="w-3.5 h-3.5 text-[#9aa0a6] shrink-0" />
                  <span>No CSV/ZIP exports</span>
                </li>
                <li className="flex items-center gap-1.5 text-[#5f6368]">
                  <Lock className="w-3.5 h-3.5 text-[#9aa0a6] shrink-0" />
                  <span>Copy & Right-click locked</span>
                </li>
              </ul>
            </div>

            {/* Pay-Per-Crawl */}
            <div className="p-3.5 rounded-md border border-[#1a73e8] bg-[#e8f0fe]/30 space-y-2 relative">
              <div className="absolute -top-2 right-2 px-1.5 py-0.5 bg-[#1a73e8] text-white rounded text-[9px] font-medium uppercase tracking-wider">
                Standard
              </div>
              <div className="font-semibold text-[#1a73e8] flex items-center justify-between">
                <span>Per Crawl</span>
                <span className="font-mono text-xs text-[#1a73e8] font-semibold">$1 / crawl</span>
              </div>
              <ul className="space-y-1.5 text-[#202124] text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span>Unrestricted Crawling</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span>CSV Export Unlocked</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
                  <span>Full Copy & Selection</span>
                </li>
              </ul>
            </div>

            {/* Advanced Runs */}
            <div className="p-3.5 rounded-md border border-[#dadce0] bg-white space-y-2">
              <div className="font-medium text-[#202124] flex items-center justify-between">
                <span>Advanced Features</span>
                <span className="font-mono text-xs text-[#1a73e8] font-medium">$3 / run</span>
              </div>
              <ul className="space-y-1.5 text-[#3c4043] text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
                  <span>Auto-Fix All Engine</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
                  <span>Gemini AI Suggestions</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
                  <span>Clean HTML ZIP Export</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Add Balance Options */}
          {!isSuperAdmin && (
            <div className="space-y-3 pt-2 border-t border-[#dadce0]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#1a73e8]" />
                  <span>Select Credit Top-Up</span>
                </h4>
                <span className="text-[11px] text-[#5f6368]">Credits never expire</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* $1 Instant Crawl */}
                <button
                  type="button"
                  onClick={() => setSelectedPack(1)}
                  className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                    selectedPack === 1 
                      ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]' 
                      : 'border-[#dadce0] bg-white hover:bg-[#f8fafd] text-[#3c4043]'
                  }`}
                >
                  <div className="text-xs font-semibold">$1</div>
                  <div className="text-[10px] text-[#5f6368] font-normal mt-0.5">1 Crawl</div>
                </button>

                {/* $3 Single Advanced Run */}
                <button
                  type="button"
                  onClick={() => setSelectedPack(3)}
                  className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                    selectedPack === 3 
                      ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]' 
                      : 'border-[#dadce0] bg-white hover:bg-[#f8fafd] text-[#3c4043]'
                  }`}
                >
                  <div className="text-xs font-semibold">$3</div>
                  <div className="text-[10px] text-[#5f6368] font-normal mt-0.5">1 Adv. Run</div>
                </button>

                {/* $5 Popular Pack */}
                <button
                  type="button"
                  onClick={() => setSelectedPack(5)}
                  className={`p-3 rounded-md border text-left transition-all relative cursor-pointer ${
                    selectedPack === 5 
                      ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]' 
                      : 'border-[#dadce0] bg-white hover:bg-[#f8fafd] text-[#3c4043]'
                  }`}
                >
                  <span className="absolute -top-2 right-2 px-1 py-0.2 bg-[#1a73e8] text-white rounded text-[8px] font-medium">BEST</span>
                  <div className="text-xs font-semibold">$5</div>
                  <div className="text-[10px] text-[#5f6368] font-normal mt-0.5">5 Crawls / Mix</div>
                </button>

                {/* $20 Pro Pack */}
                <button
                  type="button"
                  onClick={() => setSelectedPack(20)}
                  className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                    selectedPack === 20 
                      ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]' 
                      : 'border-[#dadce0] bg-white hover:bg-[#f8fafd] text-[#3c4043]'
                  }`}
                >
                  <div className="text-xs font-semibold">$20</div>
                  <div className="text-[10px] text-[#5f6368] font-normal mt-0.5">Pro Unlimited</div>
                </button>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleAddCredits(selectedPack)}
                className="w-full mt-2 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing instant credit authorization...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    <span>
                      Add ${selectedPack}.00 Balance & Unlock {triggerReason === 'export' ? 'Data Exports' : triggerReason === 'advanced' ? 'Advanced Run' : 'Instant Crawling'}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-[#5f6368] pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#137333]" />
                  Instant Test Checkout
                </span>
                <span>•</span>
                <span>Pay-As-You-Go ($1/crawl, $3/adv run)</span>
              </div>
            </div>
          )}

          {/* Development Notice for ACE Orchestrator */}
          <div className="p-3 bg-[#fef7e0] border border-[#fce8b2] rounded-md text-xs text-[#3c4043] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#b06000] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[#202124]">Notice regarding ACE Orchestrator:</strong> The ACE cognitive architecture is undergoing benchmarking and remains inaccessible until dedicated compute pricing is calibrated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
