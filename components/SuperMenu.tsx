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
        return 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]';
      case 'warning':
        return 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]';
      case 'success':
        return 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]';
      case 'primary':
        return 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]';
      default:
        return 'bg-[#f1f3f4] text-[#3c4043] border-[#dadce0]';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#202124]/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Super Menu Container (2-Tier Google Cloud-style sidebar) */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[65px] h-screen lg:h-[calc(100vh-65px)] z-50 lg:z-30 
        flex shrink-0 transition-all duration-200 ease-in-out select-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* ============================================================== */}
        {/* TIER 1: PRIMARY ICON RAIL (Google Cloud Style Rail) */}
        {/* ============================================================== */}
        <div className="w-14 sm:w-16 bg-[#ffffff] border-r border-[#dadce0] flex flex-col items-center justify-between py-4 z-20 text-[#5f6368]">
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
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#e8f0fe] text-[#1a73e8]'
                  : 'hover:bg-[#f1f3f4] text-[#5f6368] hover:text-[#202124]'
              }`}
            >
              <Home className="w-5 h-5" />
            </button>

            <div className="w-8 h-px bg-[#dadce0] my-1" />

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
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group cursor-pointer ${
                    isActiveDomain || hasActiveTabInDomain
                      ? 'bg-[#e8f0fe] text-[#1a73e8]'
                      : 'hover:bg-[#f1f3f4] hover:text-[#202124] text-[#5f6368]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  
                  {/* Active Indicator Dot */}
                  {hasActiveTabInDomain && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#1a73e8] ring-2 ring-white" />
                  )}

                  {/* Tooltip on Hover */}
                  <div className="absolute left-full ml-3 px-2 py-1 bg-[#202124] text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
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
              title="Gemini SuperAdmin Copilot"
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#f8fafd] border border-[#dadce0] hover:bg-[#e8f0fe] text-[#1a73e8] transition-colors cursor-pointer relative group"
            >
              <Bot className="w-5 h-5 text-[#1a73e8]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#1e8e3e]" />
              <div className="absolute left-full ml-3 px-2 py-1 bg-[#202124] text-white text-[11px] font-medium rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Gemini AI Copilot
              </div>
            </button>

            {/* Desktop Collapse / Expand Toggle Button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand Super Menu' : 'Collapse Super Menu'}
                className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center hover:bg-[#f1f3f4] text-[#5f6368] hover:text-[#202124] transition-colors cursor-pointer"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile Close */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f1f3f4] text-[#5f6368] cursor-pointer"
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
          bg-[#ffffff] border-r border-[#dadce0] h-full flex flex-col justify-between overflow-hidden transition-all duration-200 ease-in-out
          ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-56 sm:w-64 opacity-100'}
        `}>
          {/* Top Panel Header */}
          <div className="p-3.5 border-b border-[#dadce0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#202124]">
                {domains.find(d => d.id === activeDomain)?.name || 'Platform Tools'}
              </span>
            </div>
            <span className="text-[11px] text-[#5f6368] font-normal">
              {domainTools.length} {domainTools.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Nav List with Tab Buttons */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1 scrollbar-thin">
            {domainTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = activeTab === tool.id;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleSelectTool(tool.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer group ${
                    isSelected
                      ? 'bg-[#e8f0fe] text-[#1967d2] font-medium'
                      : 'hover:bg-[#f8f9fa] text-[#3c4043]'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-md shrink-0 transition-colors ${
                    isSelected 
                      ? 'bg-[#1a73e8] text-white' 
                      : 'bg-[#f1f3f4] text-[#5f6368] group-hover:text-[#202124]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs truncate ${
                        isSelected ? 'font-medium text-[#1967d2]' : 'font-normal text-[#202124]'
                      }`}>
                        {tool.title}
                      </span>
                      {tool.badge !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium shrink-0 border ${getBadgeStyle(tool.badgeType)}`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5f6368] line-clamp-1 leading-tight mt-0.5 font-normal">
                      {tool.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Quick Helper / Actions for this domain */}
            <div className="pt-3 mt-3 border-t border-[#dadce0]">
              <div className="px-2 py-1 text-[11px] uppercase text-[#5f6368] font-medium tracking-wider">
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
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#1a73e8] hover:bg-[#e8f0fe] rounded-md flex items-center justify-between cursor-pointer font-medium"
                  >
                    <span>Fix All HTML Defects</span>
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
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#1a73e8] hover:bg-[#e8f0fe] rounded-md flex items-center justify-between cursor-pointer font-medium"
                  >
                    <span>SMTP Relay Settings</span>
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
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#1a73e8] hover:bg-[#e8f0fe] rounded-md flex items-center justify-between cursor-pointer font-medium"
                  >
                    <span>Ask Gemini Assistant</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeDomain === 'engineering' && (
                <div className="space-y-1 mt-1">
                  <button
                    type="button"
                    onClick={() => handleSelectTool('codebase')}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#1a73e8] hover:bg-[#e8f0fe] rounded-md flex items-center justify-between cursor-pointer font-medium"
                  >
                    <span>Open Virtual File Tree</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Status Card */}
          <div className="p-3 border-t border-[#dadce0] bg-[#f8fafd]">
            <div className="flex items-center justify-between text-[11px] text-[#5f6368]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1e8e3e]" />
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
