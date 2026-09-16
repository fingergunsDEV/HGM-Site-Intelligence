'use client';

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  FolderTree, 
  Layers, 
  Cpu, 
  Globe, 
  FileCode2,
  Sparkles,
  Flame,
  Mail,
  User,
  Crown,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Zap,
  Lock,
  GitCommit,
  FileJson,
  Bot,
  Menu,
  X,
  UserPlus,
  Search,
  Sliders,
  Terminal
} from 'lucide-react';
import { CrawlSummary, AppTabType } from '@/types/site-intelligence';
import { UserAccount } from '@/types/auth';
import { useIsMounted, isUserFeatureUnlocked, isOwnerUser, isBetaTesterUser } from '@/lib/auth-storage';

export type { AppTabType } from '@/types/site-intelligence';

interface NavItem {
  id: AppTabType;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category: 'core' | 'analysis' | 'dev';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity, description: 'Live health scores & crawler summary', category: 'core' },
  { id: 'results', label: 'Pages & Schemas', shortLabel: 'Pages', icon: Layers, description: 'URL inventory & Schema.org microdata', category: 'core' },
  { id: 'fixall', label: 'Auto-Fix All', shortLabel: 'Fix All', icon: Zap, description: '1-Click bulk HTML remediation & clean HTML ZIP', category: 'core' },
  { id: 'graph', label: 'Link Graph', icon: Network, description: 'Internal link topology & PageRank weights', category: 'analysis' },
  { id: 'heatmap', label: 'SEO Heatmap', icon: Flame, description: 'Visual issue density & health matrix', category: 'analysis' },
  { id: 'ai', label: 'AI Optimizer', icon: Sparkles, description: 'Gemini recommendations & auto-links', category: 'analysis' },
  { id: 'codebase', label: 'Codebase IDE', icon: FolderTree, description: 'Virtual file tree & HTML editor', category: 'dev' },
  { id: 'payloads', label: 'JSON Engine', icon: FileJson, description: 'JSON-LD payload generator & batch ingest', category: 'dev' },
  { id: 'cicd', label: 'CI/CD Pipeline', shortLabel: 'CI/CD', icon: GitCommit, description: 'Automated verification & deploy stages', category: 'dev' },
  { id: 'orchestrator', label: 'ACE Orchestrator', shortLabel: 'Orchestrator', icon: Cpu, description: 'Autonomous cognitive entity 6-layer graph', category: 'dev' },
  { id: 'smtp', label: 'SMTP Relay', icon: Mail, description: 'Mail server configuration, ping test & alerts', category: 'core' },
  { id: 'logs', label: 'Crawl Terminal', shortLabel: 'Terminal', icon: Terminal, description: 'Live crawl event logger & debug stream', category: 'core' },
  { id: 'architecture', label: 'Architecture', icon: FileCode2, description: 'System design spec & pipeline docs', category: 'dev' },
];

interface HeaderProps {
  summary: CrawlSummary;
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  selectedPreset: string;
  onSelectPreset: (presetName: string) => void;
  onOpenSmtpModal?: () => void;
  user: UserAccount | null;
  onOpenAuthModal: (mode?: 'signup' | 'signin') => void;
  onOpenSubscriptionModal: (reason?: 'copy' | 'export' | 'limit' | 'general') => void;
  onSignOut: () => void;
  onOpenSuperAdminChat?: () => void;
  onOpenBetaTestersModal?: () => void;
  onToggleSuperMenu?: () => void;
  onOpenToolSwitcher?: () => void;
  isSuperMenuCollapsed?: boolean;
}

export function Header({
  summary,
  activeTab,
  setActiveTab,
  selectedPreset,
  onSelectPreset,
  onOpenSmtpModal,
  user,
  onOpenAuthModal,
  onOpenSubscriptionModal,
  onSignOut,
  onOpenSuperAdminChat,
  onOpenBetaTestersModal,
  onToggleSuperMenu,
  onOpenToolSwitcher,
  isSuperMenuCollapsed
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'analysis' | 'dev' | 'more' | 'mobile' | null>(null);
  const mounted = useIsMounted();

  // Keyboard shortcut Cmd+K or Ctrl+K to open tool switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpenToolSwitcher) onOpenToolSwitcher();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenToolSwitcher]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-nav-dropdown]')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openDropdown]);

  const isOwner = mounted && isOwnerUser(user);
  const isBeta = mounted && isBetaTesterUser(user);
  const isPro = mounted && isUserFeatureUnlocked(user);

  const getStatusBadge = () => {
    switch (summary.status) {
      case 'running':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Crawling Live ({summary.crawledPages}/{summary.totalPages})
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Paused
          </div>
        );
      case 'done':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Crawl Complete ({summary.crawledPages} pages)
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            Crawl Error
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-300 text-slate-600 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Ready to Crawl
          </div>
        );
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left Section: Super Menu Toggle, Brand & "Go to tool..." */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Super Menu Toggle Button */}
            {onToggleSuperMenu && (
              <button
                type="button"
                onClick={onToggleSuperMenu}
                className="p-2 -ml-1 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer flex items-center gap-1.5"
                title={isSuperMenuCollapsed ? "Expand Super Menu (Semrush Layout)" : "Collapse Super Menu"}
              >
                <Sliders className="w-5 h-5 text-indigo-600" />
                <span className="hidden xl:inline text-xs font-bold text-slate-800 font-mono">Super Menu</span>
              </button>
            )}

            {/* Brand & Identity */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-xs ring-1 ring-slate-800 shrink-0">
                <Network className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-950 font-mono">
                    Site Intelligence
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Pro
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-medium hidden md:block">
                  Enterprise SEO & Schema Crawler
                </p>
              </div>
            </div>

            {/* Semrush-Style "Go to tool..." Search Bar */}
            {onOpenToolSwitcher && (
              <button
                type="button"
                onClick={onOpenToolSwitcher}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-500 rounded-xl text-xs transition-all cursor-pointer w-44 lg:w-56"
                title="Go to tool... (⌘K / Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="flex-1 text-left text-slate-600 text-xs truncate">Go to tool...</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.2 bg-white border border-slate-200 rounded text-slate-600 shadow-2xs font-semibold">⌘K</kbd>
              </button>
            )}
          </div>

          {/* User Account, Tier Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Tool Search Trigger */}
            {onOpenToolSwitcher && (
              <button
                type="button"
                onClick={onOpenToolSwitcher}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Go to tool..."
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Target Host */}
            <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-mono">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-medium text-slate-600">Target:</span>
              <span className="font-semibold text-slate-900">holisticgrowthmarketing.com</span>
            </div>

            {/* SMTP Relay */}
            {onOpenSmtpModal && (
              <button
                type="button"
                onClick={onOpenSmtpModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 shadow-2xs transition-colors cursor-pointer"
                title="Configure SMTP Relay & Email Reports"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>SMTP Relay</span>
              </button>
            )}

            {/* Plan / VIP Status CTA Button */}
            {isOwner ? (
              <div className="flex items-center gap-1.5">
                <span 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-lg text-xs font-black shadow-xs"
                  title="Super Admin: Full access without paywalls"
                >
                  <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span>Super Admin</span>
                </span>
                {onOpenBetaTestersModal && (
                  <button
                    type="button"
                    onClick={onOpenBetaTestersModal}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-lg border border-cyan-200 shadow-2xs transition-colors cursor-pointer"
                    title="Manage & Configure Limited Test Users"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Test Users</span>
                  </button>
                )}
              </div>
            ) : isBeta ? (
              <span 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-bold"
                title={`Test User: ${user?.crawlsRunCount || 0}/${user?.testerPermissions?.allowedCrawls ?? 5} Crawls Used`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Test User ({user?.crawlsRunCount || 0}/{user?.testerPermissions?.allowedCrawls ?? 5})</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onOpenSubscriptionModal('general')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs border border-slate-700 transition-colors cursor-pointer"
                title="Balance & Pricing ($1/crawl, $3/adv run)"
              >
                <span className="text-emerald-400 font-mono font-bold">${(user?.balance ?? 0).toFixed(2)}</span>
                <span className="text-slate-300 font-normal">Credits</span>
              </button>
            )}

            {/* User Account / Auth Trigger */}
            {!mounted || !user ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signin')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer bg-white"
                  title="Sign in with Google Account"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Sign in</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Free Trial</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block font-medium truncate max-w-[100px]">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {user.authProvider === 'google' && (
                            <span className="text-[10px] font-normal text-slate-400 font-mono">(Google)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate font-mono">
                          {user.email}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-600">Plan:</span>
                          {isOwner ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                              👑 Owner VIP
                            </span>
                          ) : isBeta ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                              ✨ Beta Tester
                            </span>
                          ) : isPro ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              Pro ($20/mo)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                              Free ({user.crawlsUsed}/1 Test Used)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-1 space-y-0.5">
                        {isOwner && onOpenBetaTestersModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              onOpenBetaTestersModal();
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4 text-indigo-600" />
                            <span>Invite Beta Testers</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenSubscriptionModal('general');
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Crown className="w-4 h-4 text-amber-500" />
                          <span>
                            {isOwner ? 'Owner Subscription Details' : isBeta ? 'Beta Status Details' : isPro ? 'Manage Subscription ($20/mo)' : 'Upgrade to Pro ($20/mo)'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onSignOut();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* SuperAdmin Assistant Button */}
            {onOpenSuperAdminChat && (
              <button
                type="button"
                onClick={onOpenSuperAdminChat}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg border border-indigo-500/40 shadow-xs transition-all hover:border-indigo-400 cursor-pointer"
                title="Open Gemini Flash 3.8 SuperAdmin Assistant"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Gemini 3.8</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                  Admin
                </span>
              </button>
            )}

            <div className="hidden xl:block">
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Navigation Bar - Fully Responsive with Zero Scrollbars */}
        {(() => {
          const currentActive = NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0];
          const ActiveIcon = currentActive.icon;
          const isAnalysisActive = ['graph', 'heatmap', 'ai'].includes(activeTab);
          const isDevActive = ['payloads', 'codebase', 'architecture'].includes(activeTab);
          const isMoreActive = !['dashboard', 'orchestrator', 'results'].includes(activeTab);

          const analysisItems = NAV_ITEMS.filter(i => i.category === 'analysis');
          const devItems = NAV_ITEMS.filter(i => i.category === 'dev');
          const moreItems = NAV_ITEMS.filter(i => !['dashboard', 'orchestrator', 'results'].includes(i.id));

          return (
            <div className="relative border-t border-slate-100 py-1.5" data-nav-dropdown>
              {/* Desktop Navigation (lg+) */}
              <div className="hidden lg:flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Dashboard */}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('dashboard'); setOpenDropdown(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dashboard</span>
                  </button>

                  {/* ACE Orchestrator */}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('orchestrator'); setOpenDropdown(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'orchestrator'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ACE Orchestrator</span>
                  </button>

                  {/* CI/CD Pipeline */}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('cicd'); setOpenDropdown(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'cicd'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CI/CD Pipeline</span>
                  </button>

                  {/* Pages & Schemas */}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('results'); setOpenDropdown(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'results'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Pages & Schemas</span>
                    {summary.crawledPages > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        activeTab === 'results' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {summary.crawledPages}
                      </span>
                    )}
                  </button>

                  {/* Analysis & SEO Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === 'analysis' ? null : 'analysis')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isAnalysisActive
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : openDropdown === 'analysis'
                          ? 'bg-slate-200 text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isAnalysisActive ? <ActiveIcon className="w-3.5 h-3.5 text-amber-400" /> : <Network className="w-3.5 h-3.5 text-teal-500" />}
                      <span>{isAnalysisActive ? `Analysis: ${currentActive.label}` : 'Analysis & SEO'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'analysis' ? 'rotate-180' : ''}`} />
                    </button>

                    {openDropdown === 'analysis' && (
                      <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider border-b border-slate-100 mb-1">
                          Visual & Graph Analytics
                        </div>
                        {analysisItems.map(item => {
                          const Icon = item.icon;
                          const isSelected = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                                <div>
                                  <div className="font-semibold">{item.label}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
                                </div>
                              </div>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Developer Tools Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === 'dev' ? null : 'dev')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isDevActive
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : openDropdown === 'dev'
                          ? 'bg-slate-200 text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isDevActive ? <ActiveIcon className="w-3.5 h-3.5 text-blue-400" /> : <FileJson className="w-3.5 h-3.5 text-blue-500" />}
                      <span>{isDevActive ? `Tools: ${currentActive.label}` : 'Developer Tools'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'dev' ? 'rotate-180' : ''}`} />
                    </button>

                    {openDropdown === 'dev' && (
                      <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider border-b border-slate-100 mb-1">
                          Engineering & File Ingest
                        </div>
                        {devItems.map(item => {
                          const Icon = item.icon;
                          const isSelected = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                                <div>
                                  <div className="font-semibold">{item.label}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
                                </div>
                              </div>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Status Pill on Desktop */}
                <div className="text-xs text-slate-500 font-mono hidden xl:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Engine Online</span>
                </div>
              </div>

              {/* Tablet Navigation (md to lg) */}
              <div className="hidden md:flex lg:hidden items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('dashboard'); setOpenDropdown(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('orchestrator'); setOpenDropdown(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'orchestrator'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Orchestrator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('results'); setOpenDropdown(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'results'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Pages</span>
                    {summary.crawledPages > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-slate-200 text-slate-700">
                        {summary.crawledPages}
                      </span>
                    )}
                  </button>

                  {/* Tablet "More" Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isMoreActive
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : openDropdown === 'more'
                          ? 'bg-slate-200 text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isMoreActive ? <ActiveIcon className="w-3.5 h-3.5 text-amber-400" /> : <Menu className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{isMoreActive ? `View: ${currentActive.label}` : 'More Views (7)'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'more' ? 'rotate-180' : ''}`} />
                    </button>

                    {openDropdown === 'more' && (
                      <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 max-h-80 overflow-y-auto">
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider border-b border-slate-100 mb-1">
                          Pipeline & Analysis Modules
                        </div>
                        {moreItems.map(item => {
                          const Icon = item.icon;
                          const isSelected = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                                <div>
                                  <div className="font-semibold">{item.label}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
                                </div>
                              </div>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  {summary.status === 'running' ? 'Crawling...' : 'Ready'}
                </div>
              </div>

              {/* Mobile Navigation (< md) - Zero Horizontal Scrollbars */}
              <div className="flex md:hidden items-center justify-between gap-2">
                {/* Active Tab Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold font-mono shadow-xs truncate">
                  <ActiveIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{currentActive.label}</span>
                </div>

                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'mobile' ? null : 'mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer shrink-0 ${
                    openDropdown === 'mobile'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
                  }`}
                >
                  {openDropdown === 'mobile' ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>All Views (10)</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'mobile' ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Mobile Full Dropdown Panel */}
              {openDropdown === 'mobile' && (
                <div className="md:hidden absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in-50 zoom-in-95 max-h-[75vh] overflow-y-auto">
                  {/* Category 1: Core */}
                  <div className="mb-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider px-2 mb-1">
                      Core Operations
                    </div>
                    <div className="space-y-1">
                      {NAV_ITEMS.filter(i => i.category === 'core').map(item => {
                        const Icon = item.icon;
                        const isSelected = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer min-h-[44px] ${
                              isSelected ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                              <div>
                                <div className="font-semibold">{item.label}</div>
                                <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{item.description}</div>
                              </div>
                            </div>
                            {isSelected && <span className="text-[10px] font-mono font-bold text-indigo-300">ACTIVE</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 2: Analysis */}
                  <div className="mb-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider px-2 mb-1">
                      SEO & Graph Analytics
                    </div>
                    <div className="space-y-1">
                      {NAV_ITEMS.filter(i => i.category === 'analysis').map(item => {
                        const Icon = item.icon;
                        const isSelected = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer min-h-[44px] ${
                              isSelected ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                              <div>
                                <div className="font-semibold">{item.label}</div>
                                <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{item.description}</div>
                              </div>
                            </div>
                            {isSelected && <span className="text-[10px] font-mono font-bold text-indigo-300">ACTIVE</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 3: Developer */}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider px-2 mb-1">
                      Developer & Ingest
                    </div>
                    <div className="space-y-1">
                      {NAV_ITEMS.filter(i => i.category === 'dev').map(item => {
                        const Icon = item.icon;
                        const isSelected = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer min-h-[44px] ${
                              isSelected ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                              <div>
                                <div className="font-semibold">{item.label}</div>
                                <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{item.description}</div>
                              </div>
                            </div>
                            {isSelected && <span className="text-[10px] font-mono font-bold text-indigo-300">ACTIVE</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </header>
  );
}

