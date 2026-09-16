'use client';

import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  FolderTree, 
  Grid3x3, 
  Search, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  SlidersHorizontal, 
  Layers, 
  BarChart3,
  ShieldAlert,
  ChevronRight,
  Code2,
  FileText,
  TrendingDown,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { PageMetadata, AuditIssue } from '@/types/site-intelligence';

interface SeoHeatmapProps {
  pages: PageMetadata[];
  onOpenAudit?: (page: PageMetadata) => void;
  onOpenSchema?: (page: PageMetadata) => void;
  onStartCrawl?: () => void;
}

type HeatmapMetricMode = 'overall' | 'critical' | 'content' | 'links';
type ViewLayoutMode = 'matrix' | 'tree' | 'breakdown';

interface PageHeatmapNode {
  page: PageMetadata;
  path: string;
  pathSegments: string[];
  section: string;
  depth: number;
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  totalIssues: number;
  severityScore: number; // 0 to 100 where higher is worse/hotter
  healthScore: number;   // 0 to 100 where 100 is perfect
  heatIntensity: 'pristine' | 'minor' | 'moderate' | 'critical';
}

export function SeoHeatmap({
  pages,
  onOpenAudit,
  onOpenSchema,
  onStartCrawl
}: SeoHeatmapProps) {
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('overall');
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>('matrix');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [selectedPageUrl, setSelectedPageUrl] = useState<string | null>(pages[0]?.url || null);

  // Compute structured heatmap nodes
  const heatmapNodes: PageHeatmapNode[] = useMemo(() => {
    return pages.map((page) => {
      let path = page.url;
      try {
        const parsed = new URL(page.url);
        path = parsed.pathname;
      } catch {
        path = page.url.replace(/^https?:\/\/[^\/]+/, '') || '/';
      }

      if (!path.startsWith('/')) path = '/' + path;
      const segments = path.split('/').filter(Boolean);
      const depth = segments.length;
      const section = segments.length > 0 ? `/${segments[0]}` : '/ (Root)';

      const criticalCount = page.issues?.filter(i => i.type === 'critical').length || 0;
      const warningCount = page.issues?.filter(i => i.type === 'warning').length || 0;
      const noticeCount = page.issues?.filter(i => i.type === 'notice').length || 0;
      const totalIssues = page.issues?.length || 0;

      // Calculate severity score (0 to 100)
      // Critical has highest weight, warnings moderate, missing alt/canonicals added
      let rawSeverity = (criticalCount * 30) + (warningCount * 12) + (noticeCount * 4);
      if (page.imagesWithoutAlt && page.imagesWithoutAlt > 0) {
        rawSeverity += page.imagesWithoutAlt * 5;
      }
      if (page.inlinksCount === 0 && depth > 0) {
        rawSeverity += 15; // Orphan risk penalty
      }
      if (!page.canonicalUrl) {
        rawSeverity += 10;
      }

      const severityScore = Math.min(100, rawSeverity);
      const healthScore = Math.max(0, 100 - severityScore);

      let heatIntensity: 'pristine' | 'minor' | 'moderate' | 'critical' = 'pristine';
      if (criticalCount > 0 || severityScore >= 45) {
        heatIntensity = 'critical';
      } else if (warningCount >= 2 || severityScore >= 20) {
        heatIntensity = 'moderate';
      } else if (warningCount === 1 || noticeCount > 0 || severityScore > 0) {
        heatIntensity = 'minor';
      } else {
        heatIntensity = 'pristine';
      }

      return {
        page,
        path,
        pathSegments: segments,
        section,
        depth,
        criticalCount,
        warningCount,
        noticeCount,
        totalIssues,
        severityScore,
        healthScore,
        heatIntensity
      };
    });
  }, [pages]);

  // Unique sections/directories
  const sections = useMemo(() => {
    const set = new Set<string>();
    heatmapNodes.forEach(n => set.add(n.section));
    return ['ALL', ...Array.from(set)];
  }, [heatmapNodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return heatmapNodes.filter(node => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = node.page.title?.toLowerCase().includes(q);
        const matchUrl = node.page.url.toLowerCase().includes(q);
        const matchPath = node.path.toLowerCase().includes(q);
        if (!matchTitle && !matchUrl && !matchPath) return false;
      }

      // Section filter
      if (selectedSection !== 'ALL' && node.section !== selectedSection) {
        return false;
      }

      // Severity filter
      if (selectedSeverityFilter === 'CRITICAL' && node.criticalCount === 0) return false;
      if (selectedSeverityFilter === 'WARNINGS' && node.warningCount === 0 && node.criticalCount === 0) return false;
      if (selectedSeverityFilter === 'HEALTHY' && (node.criticalCount > 0 || node.warningCount > 0)) return false;

      return true;
    });
  }, [heatmapNodes, searchQuery, selectedSection, selectedSeverityFilter]);

  // Grouped by section for Matrix view
  const groupedBySection = useMemo(() => {
    const groups: { [key: string]: PageHeatmapNode[] } = {};
    filteredNodes.forEach(node => {
      if (!groups[node.section]) groups[node.section] = [];
      groups[node.section].push(node);
    });
    return groups;
  }, [filteredNodes]);

  // Overall Site KPI computations
  const kpis = useMemo(() => {
    if (heatmapNodes.length === 0) {
      return {
        avgHealth: 100,
        criticalHotspots: 0,
        warningHotspots: 0,
        pristinePages: 0,
        maxDepth: 0,
        topVulnerableSection: 'None'
      };
    }

    const totalHealth = heatmapNodes.reduce((sum, n) => sum + n.healthScore, 0);
    const avgHealth = Math.round(totalHealth / heatmapNodes.length);
    const criticalHotspots = heatmapNodes.filter(n => n.criticalCount > 0 || n.heatIntensity === 'critical').length;
    const warningHotspots = heatmapNodes.filter(n => n.heatIntensity === 'moderate').length;
    const pristinePages = heatmapNodes.filter(n => n.heatIntensity === 'pristine').length;
    const maxDepth = Math.max(...heatmapNodes.map(n => n.depth), 0);

    // Find section with worst average health
    const sectionHealthMap: { [key: string]: { total: number; count: number } } = {};
    heatmapNodes.forEach(n => {
      if (!sectionHealthMap[n.section]) {
        sectionHealthMap[n.section] = { total: 0, count: 0 };
      }
      sectionHealthMap[n.section].total += n.healthScore;
      sectionHealthMap[n.section].count += 1;
    });

    let worstSection = 'None';
    let minAvg = 101;
    Object.entries(sectionHealthMap).forEach(([sec, data]) => {
      const avg = data.total / data.count;
      if (avg < minAvg) {
        minAvg = avg;
        worstSection = sec;
      }
    });

    return {
      avgHealth,
      criticalHotspots,
      warningHotspots,
      pristinePages,
      maxDepth,
      topVulnerableSection: worstSection
    };
  }, [heatmapNodes]);

  // Currently selected node for detailed inspection
  const selectedNode = useMemo(() => {
    return heatmapNodes.find(n => n.page.url === selectedPageUrl) || heatmapNodes[0] || null;
  }, [heatmapNodes, selectedPageUrl]);

  // Color mappings based on mode & intensity
  const getNodeColorStyles = (node: PageHeatmapNode) => {
    if (metricMode === 'critical') {
      if (node.criticalCount >= 2) {
        return {
          bg: 'bg-rose-600',
          border: 'border-rose-700',
          text: 'text-white',
          badge: 'bg-rose-950/40 text-rose-100',
          indicator: 'bg-rose-400'
        };
      }
      if (node.criticalCount === 1) {
        return {
          bg: 'bg-rose-500',
          border: 'border-rose-600',
          text: 'text-white',
          badge: 'bg-rose-900/30 text-rose-100',
          indicator: 'bg-rose-300'
        };
      }
      return {
        bg: 'bg-emerald-500/90',
        border: 'border-emerald-600',
        text: 'text-white',
        badge: 'bg-emerald-900/30 text-emerald-100',
        indicator: 'bg-emerald-300'
      };
    }

    if (metricMode === 'content') {
      const contentIssues = (node.page.imagesWithoutAlt || 0) + (node.page.wordCount < 600 ? 1 : 0);
      if (contentIssues >= 2) {
        return {
          bg: 'bg-amber-600',
          border: 'border-amber-700',
          text: 'text-white',
          badge: 'bg-amber-950/30 text-amber-100',
          indicator: 'bg-amber-300'
        };
      }
      if (contentIssues === 1) {
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-600',
          text: 'text-white',
          badge: 'bg-amber-900/20 text-amber-100',
          indicator: 'bg-amber-200'
        };
      }
      return {
        bg: 'bg-emerald-500',
        border: 'border-emerald-600',
        text: 'text-white',
        badge: 'bg-emerald-900/20 text-emerald-100',
        indicator: 'bg-emerald-200'
      };
    }

    if (metricMode === 'links') {
      if (node.page.inlinksCount === 0 && node.depth > 0) {
        return {
          bg: 'bg-purple-600',
          border: 'border-purple-700',
          text: 'text-white',
          badge: 'bg-purple-950/30 text-purple-100',
          indicator: 'bg-purple-300'
        };
      }
      if (node.page.inlinksCount <= 1) {
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-600',
          text: 'text-white',
          badge: 'bg-blue-900/30 text-blue-100',
          indicator: 'bg-blue-300'
        };
      }
      return {
        bg: 'bg-indigo-600',
        border: 'border-indigo-700',
        text: 'text-white',
        badge: 'bg-indigo-950/30 text-indigo-100',
        indicator: 'bg-indigo-300'
      };
    }

    // Default: Overall Health / Severity
    switch (node.heatIntensity) {
      case 'critical':
        return {
          bg: 'bg-gradient-to-br from-rose-600 to-red-700',
          border: 'border-rose-500 shadow-rose-950/20',
          text: 'text-white',
          badge: 'bg-rose-950/50 text-rose-100',
          indicator: 'bg-rose-300 animate-pulse'
        };
      case 'moderate':
        return {
          bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
          border: 'border-amber-400 shadow-amber-950/20',
          text: 'text-white',
          badge: 'bg-amber-950/40 text-amber-100',
          indicator: 'bg-amber-200'
        };
      case 'minor':
        return {
          bg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
          border: 'border-amber-300',
          text: 'text-slate-900',
          badge: 'bg-black/20 text-slate-900',
          indicator: 'bg-yellow-100'
        };
      case 'pristine':
      default:
        return {
          bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
          border: 'border-emerald-400 shadow-emerald-950/10',
          text: 'text-white',
          badge: 'bg-emerald-950/30 text-emerald-100',
          indicator: 'bg-emerald-300'
        };
    }
  };

  if (pages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
          <Flame className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">
            SEO Architecture Heatmap Ready
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Execute a crawl to map out your site&apos;s directory hierarchy, visualize issue severity hot spots, and target high-risk pages with one-click fixes.
          </p>
        </div>
        {onStartCrawl && (
          <button
            type="button"
            onClick={onStartCrawl}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            Start Live Crawl to View Heatmap
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Header & Metric Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Site Architecture SEO Heatmap
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {kpis.criticalHotspots} Hotspots Detected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Color-coded intensity spectrum mapping URL hierarchy and structural audit vulnerabilities.
            </p>
          </div>
        </div>

        {/* View Layout & Metric Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold px-2 text-[11px]">Metric:</span>
            <button
              type="button"
              onClick={() => setMetricMode('overall')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                metricMode === 'overall'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overall Severity
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('critical')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                metricMode === 'critical'
                  ? 'bg-white text-rose-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical Only
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('content')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                metricMode === 'content'
                  ? 'bg-white text-amber-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Content & Tags
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('links')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                metricMode === 'links'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Link Equity
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setLayoutMode('matrix')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                layoutMode === 'matrix'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Matrix Section View"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              <span>Matrix Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('tree')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                layoutMode === 'tree'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Hierarchical Tree View"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Path Tree</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Site Average Health */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Avg Health Score
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono ${kpis.avgHealth >= 80 ? 'text-emerald-600' : kpis.avgHealth >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
              {kpis.avgHealth}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${kpis.avgHealth >= 80 ? 'bg-emerald-500' : kpis.avgHealth >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${kpis.avgHealth}%` }}
            />
          </div>
        </div>

        {/* Critical Danger Hotspots */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Critical Hotspots</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600">
              {kpis.criticalHotspots}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">pages</span>
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-1">
            Requires immediate fix
          </div>
        </div>

        {/* Moderate Warnings */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Warning Hotspots</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600">
              {kpis.warningHotspots}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">pages</span>
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">
            Sub-optimal metadata
          </div>
        </div>

        {/* Pristine Clean Pages */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Pristine Pages</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {kpis.pristinePages}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">of {pages.length}</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            0 SEO errors
          </div>
        </div>

        {/* Max Architecture Depth */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Max URL Depth
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-indigo-600">
              L{kpis.maxDepth}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">levels</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1 truncate">
            Crawl hierarchy
          </div>
        </div>

        {/* Vulnerable Cluster */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
            Worst Section
          </div>
          <div className="text-sm font-bold font-mono text-rose-700 truncate mt-1.5">
            {kpis.topVulnerableSection}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1 truncate">
            Lowest avg health
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search path, URL, or title in heatmap..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
          />
        </div>

        {/* Section Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 text-xs font-semibold px-1">Section:</span>
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedSection === sec
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setSelectedSeverityFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              selectedSeverityFilter === 'ALL' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeverityFilter('CRITICAL')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              selectedSeverityFilter === 'CRITICAL' ? 'bg-rose-50 text-rose-700 font-semibold shadow-2xs' : 'text-slate-600'
            }`}
          >
            Critical
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeverityFilter('WARNINGS')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              selectedSeverityFilter === 'WARNINGS' ? 'bg-amber-50 text-amber-700 font-semibold shadow-2xs' : 'text-slate-600'
            }`}
          >
            Warnings
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeverityFilter('HEALTHY')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              selectedSeverityFilter === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-2xs' : 'text-slate-600'
            }`}
          >
            Healthy
          </button>
        </div>
      </div>

      {/* 4. Color Intensity Scale Legend */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="font-bold uppercase tracking-wider text-slate-200">Heat Intensity Spectrum:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-[11px]">
          {/* Pristine */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-xs border border-emerald-400"></span>
            <span className="text-slate-200 font-semibold">Pristine (100% Health / 0 Issues)</span>
          </div>

          {/* Minor Notice */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-400 shadow-xs border border-amber-300"></span>
            <span className="text-slate-200">Minor Notice (80-99%)</span>
          </div>

          {/* Moderate Warning */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-orange-500 shadow-xs border border-orange-400"></span>
            <span className="text-slate-200 font-semibold">Moderate Warnings (50-79%)</span>
          </div>

          {/* Critical Hazard */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-600 shadow-xs border border-rose-400 animate-pulse"></span>
            <span className="text-rose-300 font-bold">Critical SEO Hazard (&lt;50% / Red Alert)</span>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Split Grid (Visual Heatmap on Left + Interactive Deep Inspector on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Heatmap Matrix or Hierarchy Tree */}
        <div className="lg:col-span-8 space-y-4">
          {/* MATRIX VIEW */}
          {layoutMode === 'matrix' && (
            <div className="space-y-4">
              {Object.keys(groupedBySection).length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  No pages match the active filters or search criteria.
                </div>
              ) : (
                Object.entries(groupedBySection).map(([sectionName, sectionNodes]) => {
                  const sectionCritical = sectionNodes.reduce((acc, n) => acc + n.criticalCount, 0);
                  const sectionAvgHealth = Math.round(sectionNodes.reduce((acc, n) => acc + n.healthScore, 0) / sectionNodes.length);

                  return (
                    <div
                      key={sectionName}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 font-mono">
                          <FolderTree className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold text-slate-900">{sectionName}</span>
                          <span className="text-[10px] text-slate-400">
                            ({sectionNodes.length} {sectionNodes.length === 1 ? 'URL' : 'URLs'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-slate-500">Avg Health:</span>
                          <span className={`font-bold ${sectionAvgHealth >= 80 ? 'text-emerald-600' : sectionAvgHealth >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {sectionAvgHealth}%
                          </span>
                          {sectionCritical > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold border border-rose-200 text-[10px]">
                              {sectionCritical} Critical
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Heatmap Tiles Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {sectionNodes.map((node) => {
                          const isSelected = selectedNode?.page.url === node.page.url;
                          const styles = getNodeColorStyles(node);

                          return (
                            <div
                              key={node.page.url}
                              onClick={() => setSelectedPageUrl(node.page.url)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[110px] ${styles.bg} ${styles.border} ${styles.text} ${
                                isSelected
                                  ? 'ring-3 ring-indigo-500 ring-offset-2 scale-[1.02] shadow-lg'
                                  : 'hover:opacity-95 hover:shadow-md'
                              }`}
                            >
                              {/* Top Bar: Depth and Issue Tag */}
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className={`px-1.5 py-0.5 rounded font-bold ${styles.badge}`}>
                                  Depth L{node.depth}
                                </span>
                                {node.criticalCount > 0 ? (
                                  <span className="flex items-center gap-1 font-bold bg-white/20 px-1.5 py-0.5 rounded">
                                    <AlertCircle className="w-3 h-3" />
                                    {node.criticalCount} Critical
                                  </span>
                                ) : node.warningCount > 0 ? (
                                  <span className="flex items-center gap-1 font-bold bg-white/20 px-1.5 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3" />
                                    {node.warningCount} Warn
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 font-bold bg-white/20 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Healthy
                                  </span>
                                )}
                              </div>

                              {/* Title & Path */}
                              <div className="my-1.5">
                                <div className="font-bold text-xs line-clamp-1 leading-snug">
                                  {node.page.title || 'Untitled Page'}
                                </div>
                                <div className="font-mono text-[10px] opacity-90 truncate mt-0.5">
                                  {node.path}
                                </div>
                              </div>

                              {/* Bottom Stats Footer */}
                              <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/20">
                                <span>Health: <strong>{node.healthScore}%</strong></span>
                                <span>{node.page.wordCount}w • {node.page.inlinksCount} in</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TREE VIEW */}
          {layoutMode === 'tree' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 font-mono">
                    HIERARCHICAL DIRECTORY TREE & BRANCH HEALTH
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {filteredNodes.length} branch nodes
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredNodes
                  .sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path))
                  .map((node) => {
                    const isSelected = selectedNode?.page.url === node.page.url;
                    const indentPx = Math.min(node.depth * 22, 120);

                    return (
                      <div
                        key={node.page.url}
                        onClick={() => setSelectedPageUrl(node.page.url)}
                        style={{ marginLeft: `${indentPx}px` }}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/30'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            node.heatIntensity === 'critical'
                              ? 'bg-rose-500 ring-2 ring-rose-300 animate-pulse'
                              : node.heatIntensity === 'moderate'
                              ? 'bg-orange-500'
                              : node.heatIntensity === 'minor'
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`} />

                          <div className="truncate min-w-0">
                            <div className="font-mono text-xs font-bold text-slate-900 truncate flex items-center gap-2">
                              <span>{node.path}</span>
                              <span className="text-[10px] font-normal text-slate-400 font-mono">
                                ({node.page.pageType})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {node.page.title}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            node.healthScore >= 80 ? 'bg-emerald-100 text-emerald-700' : node.healthScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {node.healthScore}%
                          </span>

                          {node.criticalCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                              {node.criticalCount} crit
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">0 crit</span>
                          )}

                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Page Inspector & Remediation Panel */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 sticky top-20">
              {/* Header */}
              <div className="space-y-1.5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedNode.page.pageType}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Depth Level {selectedNode.depth}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedNode.page.title || 'Untitled Page'}
                </h3>
                <p className="text-xs font-mono text-slate-500 break-all bg-slate-50 p-1.5 rounded border border-slate-200">
                  {selectedNode.page.url}
                </p>
              </div>

              {/* Health & Severity Gauge */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">SEO Health Score:</span>
                  <strong className={`text-sm ${selectedNode.healthScore >= 80 ? 'text-emerald-400' : selectedNode.healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {selectedNode.healthScore} / 100
                  </strong>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedNode.healthScore >= 80 ? 'bg-emerald-500' : selectedNode.healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${selectedNode.healthScore}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>Severity Index: <strong className="text-slate-200">{selectedNode.severityScore}</strong></span>
                  <span>Issues: <strong className="text-slate-200">{selectedNode.totalIssues}</strong></span>
                </div>
              </div>

              {/* Key Technical Signals */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Word Count</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedNode.page.wordCount} words</div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Internal Inlinks</div>
                  <div className="text-sm font-bold text-indigo-600 mt-0.5">{selectedNode.page.inlinksCount} refs</div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Images Alt Tags</div>
                  <div className={`text-sm font-bold mt-0.5 ${(selectedNode.page.imagesWithoutAlt || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {selectedNode.page.imagesWithoutAlt || 0} missing alt
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Canonical Status</div>
                  <div className={`text-sm font-bold mt-0.5 truncate ${selectedNode.page.canonicalUrl ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedNode.page.canonicalUrl ? 'Self-Canonical' : 'Missing'}
                  </div>
                </div>
              </div>

              {/* Detected Issues Checklist */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Detected Issues ({selectedNode.page.issues.length})</span>
                  {selectedNode.criticalCount > 0 && (
                    <span className="text-rose-600 text-[10px] font-bold">Action Required</span>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {selectedNode.page.issues.length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All audit checks passed. Clean structural markup.</span>
                    </div>
                  ) : (
                    selectedNode.page.issues.map((issue: AuditIssue, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          issue.type === 'critical'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : issue.type === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="font-bold">{issue.code}</span>
                          <span className="uppercase font-semibold px-1 rounded bg-black/5 text-[9px]">
                            {issue.category}
                          </span>
                        </div>
                        <p className="text-[11px] leading-snug">
                          {issue.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Remediation & Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {onOpenAudit && (
                  <button
                    type="button"
                    onClick={() => onOpenAudit(selectedNode.page)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open AI Remediation & Audit</span>
                  </button>
                )}

                {onOpenSchema && (
                  <button
                    type="button"
                    onClick={() => onOpenSchema(selectedNode.page)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Inspect JSON-LD Schema</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Select a page card from the heatmap to view diagnostic insights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
