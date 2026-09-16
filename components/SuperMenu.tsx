'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Search, 
  Sparkles, 
  Network, 
  Flame, 
  FileCode2, 
  FolderTree, 
  FileJson, 
  GitCommit, 
  Cpu, 
  Mail, 
  Terminal, 
  Bot, 
  Layers, 
  ChevronRight, 
  ChevronLeft, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Activity,
  ArrowRight,
  Database,
  BarChart3,
  BookOpen,
  Code2
} from 'lucide-react';
import { AppTabType, CrawlSummary } from '@/types/site-intelligence';
import { UserAccount } from '@/types/auth';

export interface SuperMenuTool {
  id: AppTabType;
  title: string;
  category: 'SEO & Audit' | 'AI & Optimization' | 'Link Graph & Topology' | 'Engineering & Dev' | 'Data & Schemas' | 'Relay & Logs';
  domain: 'seo' | 'ai' | 'graph' | 'engineering' | 'data' | 'relay';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeType?: 'primary' | 'danger' | 'warning' | 'success' | 'neutral';
  isNew?: boolean;
}

interface SuperMenuProps {
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  summary: CrawlSummary;
  pagesCount: number;
  logsCount: number;
  user: UserAccount | null;
  onOpenSmtpModal?: () => void;
  onOpenSuperAdminChat?: () => void;
  onOpenFixAll?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SuperMenu({
  activeTab,
  setActiveTab,
  summary,
  pagesCount,
  logsCount,
  user,
  onOpenSmtpModal,
  onOpenSuperAdminChat,
  onOpenFixAll,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}: SuperMenuProps) {
  // Domain selection for the primary rail (null means auto-follow activeTab)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Define all tools across all categories
  const allTools: SuperMenuTool[] = useMemo(() => [
    // 1. SEO & Audit Domain
    {
      id: 'dashboard',
      title: 'Dashboard & Crawl',
      category: 'SEO & Audit',
      domain: 'seo',
      description: 'Live crawler controls, progress telemetry & health score gauges',
      icon: Home,
      badge: summary.status === 'running' ? 'Crawling' : undefined,
      badgeType: 'success'
    },
    {
      id: 'results',
      title: 'Site Audit & Pages',
      category: 'SEO & Audit',
      domain: 'seo',
      description: 'URL inventory, JSON-LD microdata, title & canonical issues',
      icon: Search,
      badge: pagesCount > 0 ? pagesCount : undefined,
      badgeType: 'primary'
    },
    {
      id: 'fixall',
      title: 'Auto-Fix All Engine',
      category: 'SEO & Audit',
      domain: 'seo',
      description: '1-Click automated HTML remediation, title repair & ZIP export',
      icon: Zap,
      badge: summary.criticalIssuesCount > 0 ? `${summary.criticalIssuesCount} crit` : undefined,
      badgeType: 'danger'
    },

    // 2. Link Graph & Topology Domain
    {
      id: 'graph',
      title: 'Internal Link Graph',
      category: 'Link Graph & Topology',
      domain: 'graph',
      description: 'Physics-based internal link graph topology & PageRank weighting',
      icon: Network,
      badge: summary.totalLinksFound > 0 ? `${summary.totalLinksFound} links` : undefined,
      badgeType: 'neutral'
    },
    {
      id: 'heatmap',
      title: 'SEO Heatmap Matrix',
      category: 'Link Graph & Topology',
      domain: 'graph',
      description: 'Visual issue density, response latency & crawl depth distribution',
      icon: Flame,
      badge: undefined
    },

    // 3. AI & Optimization Domain
    {
      id: 'ai',
      title: 'AI Link Optimizer',
      category: 'AI & Optimization',
      domain: 'ai',
      description: 'Gemini 3.8 Flash semantic topic clusters & contextual anchor suggestions',
      icon: Sparkles,
      badge: summary.aiSuggestionsCount > 0 ? `${summary.aiSuggestionsCount} AI` : undefined,
      badgeType: 'primary'
    },
    {
      id: 'copilot',
      title: 'SuperAdmin AI Copilot',
      category: 'AI & Optimization',
      domain: 'ai',
      description: 'Conversational assistant for SEO remediation & site intelligence',
      icon: Bot,
      badge: 'Gemini 3.8'
    },

    // 4. Engineering & Dev Domain
    {
      id: 'codebase',
      title: 'Codebase IDE & Editor',
      category: 'Engineering & Dev',
      domain: 'engineering',
      description: 'Virtual project file tree, live in-browser HTML editor & page auditor',
      icon: FolderTree,
      badge: undefined
    },
    {
      id: 'cicd',
      title: 'CI/CD Pipeline',
      category: 'Engineering & Dev',
      domain: 'engineering',
      description: 'Automated HTML linting, schema validation & deploy verification',
      icon: GitCommit,
      badge: 'Automated'
    },
    {
      id: 'orchestrator',
      title: 'ACE Orchestrator',
      category: 'Engineering & Dev',
      domain: 'engineering',
      description: 'Autonomous cognitive entity 6-layer graph & agentic marketing engine',
      icon: Cpu,
      badge: '6-Layer'
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      category: 'Engineering & Dev',
      domain: 'engineering',
      description: 'Interactive full-stack architecture, Python engine specs & data flows',
      icon: Layers,
      badge: undefined
    },

    // 5. Data & Schemas Domain
    {
      id: 'payloads',
      title: 'JSON Engine & Ingest',
      category: 'Data & Schemas',
      domain: 'data',
      description: 'Synthesize Schema.org JSON-LD microdata & ingest external payloads',
      icon: FileJson,
      badge: summary.schemasGeneratedCount > 0 ? summary.schemasGeneratedCount : undefined,
      badgeType: 'success'
    },

    // 6. Relay & Logs Domain
    {
      id: 'smtp',
      title: 'SMTP Mail Relay',
      category: 'Relay & Logs',
      domain: 'relay',
      description: 'Mail server configuration, live socket ping & automated crawl alerts',
      icon: Mail,
      badge: 'Relay'
    },
    {
      id: 'logs',
      title: 'Live Crawl Terminal',
      category: 'Relay & Logs',
      domain: 'relay',
      description: 'Real-time terminal event logger with log filtering & export',
      icon: Terminal,
      badge: logsCount > 0 ? logsCount : undefined,
      badgeType: 'neutral'
    }
  ], [summary, pagesCount, logsCount]);

  // Determine active domain based on explicit selection or current active tab
  const currentTool = useMemo(() => allTools.find(t => t.id === activeTab), [allTools, activeTab]);
  const activeDomain = selectedDomain ?? currentTool?.domain ?? 'seo';

  // Filter tools for the current active domain in the secondary panel
  const domainTools = useMemo(() => {
    return allTools.filter(t => t.domain === activeDomain);
  }, [allTools, activeDomain]);

  // Group primary rail domain icons
  const domains = [
    { id: 'seo', name: 'SEO & Audit', icon: Search, count: 3 },
    { id: 'graph', name: 'Link Graph', icon: Network, count: 2 },
    { id: 'ai', name: 'AI & Semantics', icon: Sparkles, count: 2 },
    { id: 'engineering', name: 'Engineering', icon: Code2, count: 4 },
    { id: 'data', name: 'Data & Schemas', icon: FileJson, count: 1 },
    { id: 'relay', name: 'Relay & Logs', icon: Mail, count: 2 },
  ];

  const handleSelectTool = (toolId: AppTabType) => {
    setSelectedDomain(null);
    if (toolId === 'copilot') {
      if (onOpenSuperAdminChat) onOpenSuperAdminChat();
      if (onCloseMobile) onCloseMobile();
      return;
    }
    setActiveTab(toolId);
    if (onCloseMobile) onCloseMobile();
  };

  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case 'danger':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'primary':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Super Menu Container (2-Tier Semrush-style sidebar) */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[65px] h-screen lg:h-[calc(100vh-65px)] z-50 lg:z-30 
        flex shrink-0 transition-all duration-200 ease-in-out select-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* ============================================================== */}
        {/* TIER 1: PRIMARY ICON RAIL (Dark Slate / Semrush Navigation) */}
        {/* ============================================================== */}
        <div className="w-14 sm:w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center justify-between py-4 z-20 text-slate-400">
          {/* Top: Home & Domain Switchers */}
          <div className="w-full flex flex-col items-center space-y-3">
            {/* Quick Home / Dashboard jump */}
            <button
              type="button"
              onClick={() => {
                setSelectedDomain('seo');
                setActiveTab('dashboard');
                if (onCloseMobile) onCloseMobile();
              }}
              title="Overview & Dashboard"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Home className="w-5 h-5" />
            </button>

            <div className="w-8 h-px bg-slate-800 my-1" />

            {/* Domain Icons */}
            {domains.map((dom) => {
              const Icon = dom.icon;
              const isActiveDomain = activeDomain === dom.id;
              const hasActiveTabInDomain = allTools.some(t => t.domain === dom.id && t.id === activeTab);

              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => {
                    setSelectedDomain(dom.id);
                    // Select first tool in domain if not already inside this domain
                    const firstToolInDomain = allTools.find(t => t.domain === dom.id);
                    if (firstToolInDomain && !hasActiveTabInDomain) {
                      handleSelectTool(firstToolInDomain.id);
                    }
                  }}
                  title={dom.name}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group cursor-pointer ${
                    isActiveDomain || hasActiveTabInDomain
                      ? 'bg-slate-800 text-indigo-400 ring-1 ring-indigo-500/50'
                      : 'hover:bg-slate-900 hover:text-slate-200 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  
                  {/* Active Indicator Dot */}
                  {hasActiveTabInDomain && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
                  )}

                  {/* Tooltip on Hover */}
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {dom.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Rail Controls */}
          <div className="w-full flex flex-col items-center space-y-3">
            {/* SuperAdmin Copilot Icon */}
            <button
              type="button"
              onClick={() => {
                if (onOpenSuperAdminChat) onOpenSuperAdminChat();
              }}
              title="Gemini 3.8 SuperAdmin Copilot"
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900 text-indigo-300 transition-colors cursor-pointer relative group"
            >
              <Bot className="w-5 h-5 text-indigo-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Gemini AI Copilot
              </div>
            </button>

            {/* Desktop Collapse / Expand Toggle Button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand Super Menu' : 'Collapse Super Menu'}
                className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile Close */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TIER 2: EXPANDED SUB-NAVIGATION MENU (Categorized Tabs) */}
        {/* ============================================================== */}
        <div className={`
          bg-white border-r border-slate-200 h-full flex flex-col justify-between overflow-hidden transition-all duration-200 ease-in-out
          ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-56 sm:w-64 opacity-100'}
        `}>
          {/* Top Panel Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                {domains.find(d => d.id === activeDomain)?.name || 'Platform Tools'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-medium">
              {domainTools.length} {domainTools.length === 1 ? 'function' : 'functions'}
            </span>
          </div>

          {/* Nav List with Tab Buttons */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
            {domainTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = activeTab === tool.id;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleSelectTool(tool.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer group ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200/80 text-indigo-950 shadow-2xs font-semibold'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 transition-colors ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-2xs' 
                      : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${
                        isSelected ? 'text-indigo-900' : 'text-slate-800'
                      }`}>
                        {tool.title}
                      </span>
                      {tool.badge !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 border ${getBadgeStyle(tool.badgeType)}`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 line-clamp-1 leading-tight mt-0.5 font-normal">
                      {tool.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Quick Helper / Actions for this domain */}
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-600 font-bold tracking-wider">
                Domain Actions
              </div>

              {activeDomain === 'seo' && (
                <div className="space-y-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenFixAll) onOpenFixAll();
                      handleSelectTool('fixall');
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 rounded-lg flex items-center justify-between cursor-pointer font-medium"
                  >
                    <span>⚡ 1-Click Fix All HTML</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeDomain === 'relay' && (
                <div className="space-y-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSmtpModal) onOpenSmtpModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 rounded-lg flex items-center justify-between cursor-pointer font-medium"
                  >
                    <span>✉️ SMTP Credentials Modal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeDomain === 'ai' && (
                <div className="space-y-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSuperAdminChat) onOpenSuperAdminChat();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 rounded-lg flex items-center justify-between cursor-pointer font-medium"
                  >
                    <span>✨ Ask Gemini SuperAdmin</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeDomain === 'engineering' && (
                <div className="space-y-1 mt-1">
                  <button
                    type="button"
                    onClick={() => handleSelectTool('codebase')}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 rounded-lg flex items-center justify-between cursor-pointer font-medium"
                  >
                    <span>💻 Open Virtual File Tree</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Status Card */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Engine Active</span>
              </span>
              <span>v0.1.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
