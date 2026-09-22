'use client';

import React, { useEffect, useState } from 'react';
import { Lock, Zap, X } from 'lucide-react';
import { UserAccount } from '@/types/auth';
import { canUserExportData, isOwnerUser } from '@/lib/auth-storage';

interface ContentProtectionProps {
  user: UserAccount | null;
  onOpenSubscriptionModal: (reason: 'copy' | 'export' | 'limit' | 'general') => void;
}

export function ContentProtection({ user, onOpenSubscriptionModal }: ContentProtectionProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // If user is super admin or has paid export permissions, bypass protection
  const isProtected = !isOwnerUser(user) && !canUserExportData(user);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  useEffect(() => {
    if (!isProtected) return;

    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click on input and textarea elements for typing
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      triggerToast('Right-click is disabled on the 1 Free Test Crawl. Add credits ($1/crawl) or unlock via account balance to enable copy/exports.');
    };

    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      triggerToast('Clipboard copying is protected on the 1 Free Test Crawl. Add credits ($1/crawl) to export CSV/ZIP audit files.');
    };

    const handleCut = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
      triggerToast('Clipboard operations are disabled on Free Test Crawls.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Block Ctrl/Cmd + C, Ctrl/Cmd + U, Ctrl/Cmd + S
      if (isCmdOrCtrl && ['c', 'C', 'u', 'U', 's', 'S', 'p', 'P'].includes(e.key)) {
        e.preventDefault();
        triggerToast('Clipboard and source export shortcuts are locked on Free Test Crawl. Add credits ($1/crawl) to export.');
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProtected]);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  if (!toastVisible || !toastMessage || !isProtected) return null;

  return (
    <div 
      id="content-protection-toast"
      className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="bg-[#202124] text-white p-4 rounded-lg border border-[#3c4043] shadow-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-[#fef7e0]/15 border border-[#fce8b2]/30 flex items-center justify-center shrink-0 text-[#fbbc04] mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center justify-between font-semibold text-white mb-1">
            <span>Free Crawl Protection Active</span>
            <button 
              type="button"
              onClick={() => setToastVisible(false)}
              className="text-[#9aa0a6] hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[#dadce0] text-[11px] leading-relaxed">
            {toastMessage}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setToastVisible(false);
                onOpenSubscriptionModal('copy');
              }}
              className="px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Add Credits ($1/crawl)</span>
            </button>
            <button
              type="button"
              onClick={() => setToastVisible(false)}
              className="px-2.5 py-1.5 text-[#9aa0a6] hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
