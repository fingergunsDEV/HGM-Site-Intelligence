'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Home, 
  Sparkles, 
  Network, 
  Flame, 
  FolderTree, 
  FileJson, 
  GitCommit, 
  Cpu, 
  Layers, 
  Mail, 
  Terminal, 
  Bot, 
  Zap, 
  ArrowRight,
  CornerDownLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { AppTabType } from '@/types/site-intelligence';

interface ToolItem {
  id: AppTabType;
  title: string;
  category: string;
  description: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  actionType?: 'tab' | 'copilot' | 'smtp' | 'fixall';
}

interface ToolSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AppTabType) => void;
  onOpenSmtpModal?: () => void;
  onOpenSuperAdminChat?: () => void;
  onOpenFixAll?: () => void;
}

export function ToolSwitcherModal({
  isOpen,
  onClose,
  onSelectTab,
  onOpenSmtpModal,
  onOpenSuperAdminChat,
  onOpenFixAll
}: ToolSwitcherModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const tools: ToolItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard & Live Crawler',
      category: 'SEO & Crawling',
      description: 'Crawl configuration, progress meters, health score telemetry & summary snapshot',
      keywords: ['crawl', 'start', 'health', 'score', 'status', 'overview', 'dashboard', 'speed'],
      icon: Home,
      actionType: 'tab'
    },
    {
      id: 'results',
      title: 'Site Audit & Pages Inventory',
      category: 'SEO & Crawling',
      description: 'Page-by-page audit, title tags, canonical links, H1 structure & Schema status',
      keywords: ['pages', 'audit', 'inventory', 'table', 'urls', 'canonical', 'headings', 'issues', 'csv'],
      icon: Search,
      actionType: 'tab'
    },
    {
      id: 'fixall',
      title: 'Auto-Fix All Engine',
      category: 'SEO & Remediation',
      description: '1-Click bulk HTML remediation, clean HTML generator, before/after diff & ZIP export',
      keywords: ['fix', 'repair', 'clean', 'html', 'zip', 'remediation', 'auto', 'diff', 'download'],
      icon: Zap,
      actionType: 'fixall'
    },
    {
      id: 'graph',
      title: 'Internal Link Graph',
      category: 'Topology & Visuals',
      description: 'Physics-based interactive internal link graph network & PageRank weighting flow',
      keywords: ['graph', 'links', 'internal', 'pagerank', 'nodes', 'network', 'visualize', 'topology'],
      icon: Network,
      actionType: 'tab'
    },
    {
      id: 'heatmap',
      title: 'SEO Heatmap Matrix',
      category: 'Topology & Visuals',
      description: 'Issue severity density matrix, response latency & crawl depth distribution',
      keywords: ['heatmap', 'density', 'matrix', 'latency', 'depth', 'speed', 'distribution'],
      icon: Flame,
      actionType: 'tab'
    },
    {
      id: 'ai',
      title: 'AI Link Optimizer & Clusters',
      category: 'AI & Semantics',
      description: 'Gemini 3.8 Flash semantic topic clusters & contextual internal link suggestions',
      keywords: ['ai', 'gemini', 'suggestions', 'topics', 'clusters', 'semantic', 'anchor', 'optimizer'],
      icon: Sparkles,
      actionType: 'tab'
    },
    {
      id: 'copilot',
      title: 'Gemini 3.8 SuperAdmin Copilot',
      category: 'AI & Semantics',
      description: 'Conversational assistant with full site intelligence context & code assistance',
      keywords: ['chat', 'copilot', 'assistant', 'bot', 'gemini', 'help', 'admin', 'ai'],
      icon: Bot,
      actionType: 'copilot'
    },
    {
      id: 'codebase',
      title: 'Codebase IDE & Virtual File Tree',
      category: 'Engineering & Dev',
      description: 'In-browser project file explorer, live HTML editor, direct remediation & audit drawer',
      keywords: ['code', 'files', 'tree', 'editor', 'ide', 'virtual', 'direct', 'remediation', 'html'],
      icon: FolderTree,
      actionType: 'tab'
    },
    {
      id: 'payloads',
      title: 'JSON Engine & Schema Payloads',
      category: 'Data & Schemas',
      description: 'Synthesize Schema.org JSON-LD entities, ingest raw JSON, and validate microdata',
      keywords: ['json', 'payloads', 'schema', 'ld+json', 'ingest', 'microdata', 'entities', 'convert'],
      icon: FileJson,
      actionType: 'tab'
    },
    {
      id: 'cicd',
      title: 'CI/CD Pipeline & Health Stages',
      category: 'Engineering & Dev',
      description: 'Automated HTML linting, schema integrity assertions & deploy verification tests',
      keywords: ['cicd', 'pipeline', 'lint', 'build', 'verification', 'tests', 'deploy', 'stages'],
      icon: GitCommit,
      actionType: 'tab'
    },
    {
      id: 'orchestrator',
      title: 'ACE Cognitive Orchestrator',
      category: 'Engineering & Dev',
      description: 'Autonomous Cognitive Entity 6-layer agent graph & semantic execution hierarchy',
      keywords: ['ace', 'orchestrator', 'cognitive', 'agent', 'hierarchy', 'graph', 'layers'],
      icon: Cpu,
      actionType: 'tab'
    },
    {
      id: 'architecture',
      title: 'System Architecture Specs',
      category: 'Engineering & Dev',
      description: 'Interactive full-stack architecture diagram, Python crawler specs & microservices',
      keywords: ['architecture', 'docs', 'specs', 'python', 'diagram', 'flow', 'endpoints', 'system'],
      icon: Layers,
      actionType: 'tab'
    },
    {
      id: 'smtp',
      title: 'SMTP Mail Relay & Dispatch',
      category: 'Communications',
      description: 'Mail server configuration, live socket ping & automated crawl alerts',
      keywords: ['smtp', 'mail', 'email', 'relay', 'alerts', 'notifications', 'ping', 'server'],
      icon: Mail,
      actionType: 'smtp'
    },
    {
      id: 'logs',
      title: 'Live Crawl Terminal Log Stream',
      category: 'Communications & Logs',
      description: 'Real-time terminal event logger with level filters, URL search & log exports',
      keywords: ['logs', 'terminal', 'events', 'stream', 'debug', 'console', 'errors', 'output'],
      icon: Terminal,
      actionType: 'tab'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter tools based on query
  const filteredTools = tools.filter(tool => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      tool.title.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  const handleClose = () => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  };

  const handleExecute = (tool: ToolItem) => {
    handleClose();
    if (tool.actionType === 'copilot' && onOpenSuperAdminChat) {
      onOpenSuperAdminChat();
      return;
    }
    if (tool.actionType === 'smtp' && onOpenSmtpModal) {
      onSelectTab('smtp');
      return;
    }
    if (tool.actionType === 'fixall') {
      onSelectTab('fixall');
      if (onOpenFixAll) onOpenFixAll();
      return;
    }
    onSelectTab(tool.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredTools.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        handleExecute(filteredTools[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100">
      <div 
        className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-[#dadce0] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#dadce0] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#5f6368] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tools, reports & engines... (e.g. Site Audit, Auto-Fix All, Link Graph)"
            className="flex-1 bg-transparent text-[#202124] placeholder:text-[#80868b] text-sm font-normal focus:outline-none"
          />
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-[#f1f3f4] text-[#5f6368] hover:text-[#202124] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTools.length === 0 ? (
            <div className="p-12 text-center text-[#5f6368] text-xs">
              No matching tools found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const Icon = tool.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleExecute(tool)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-md transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8]'
                      : 'hover:bg-[#f8fafd] text-[#202124] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-md shrink-0 ${
                      isSelected ? 'bg-[#1a73e8] text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#202124] truncate">
                          {tool.title}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]">
                          {tool.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5f6368] truncate mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#1a73e8] font-medium bg-[#d2e3fc]/60 px-2 py-0.5 rounded">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#80868b]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer with Keyboard Hints */}
        <div className="p-2.5 bg-[#f8fafd] border-t border-[#dadce0] text-[11px] text-[#5f6368] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-[#dadce0] text-[10px] text-[#3c4043]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-[#dadce0] text-[10px] text-[#3c4043]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-[#dadce0] text-[10px] text-[#3c4043]">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-[#dadce0] text-[10px] text-[#3c4043]">esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <span className="text-[#80868b]">Site Intelligence Platform</span>
        </div>
      </div>
    </div>
  );
}
