'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Network, 
  Layers, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ShieldAlert, 
  Info,
  ArrowRight,
  TrendingUp,
  Maximize2,
  Minimize2,
  Sparkles,
  Search,
  Filter,
  Eye,
  Activity,
  FileCode,
  Compass,
  ArrowDownLeft,
  ArrowUpRight,
  Zap,
  Move
} from 'lucide-react';
import { PageMetadata } from '@/types/site-intelligence';

interface LinkGraphVisualizerProps {
  pages: PageMetadata[];
  onSelectPage?: (page: PageMetadata) => void;
  onOpenAudit?: (page: PageMetadata) => void;
  onOpenSchema?: (page: PageMetadata) => void;
}

type LayoutPreset = 'organic' | 'radial' | 'hierarchical';
type ViewLayoutMode = 'split' | 'expanded' | 'fullscreen';
type HighlightMode = 'all' | 'inlinks' | 'outlinks' | 'orphans';

export function LinkGraphVisualizer({ 
  pages, 
  onSelectPage, 
  onOpenAudit, 
  onOpenSchema 
}: LinkGraphVisualizerProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(pages[0]?.url || null);
  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('organic');
  const [viewMode, setViewMode] = useState<ViewLayoutMode>('split');
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('all');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [animateFlow, setAnimateFlow] = useState<boolean>(true);

  // Dragging states
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNodeUrl, setDraggingNodeUrl] = useState<string | null>(null);
  const [customPositions, setCustomPositions] = useState<Record<string, { cx: number; cy: number }>>({});
  const mouseStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 1. Calculate simplified PageRank scores iteratively
  const pageRankScores = useMemo(() => {
    const N = pages.length;
    if (N === 0) return new Map<string, number>();

    let pr = new Map<string, number>();
    pages.forEach(p => pr.set(p.url, 1 / N));

    const damping = 0.85;
    const iterations = 20;

    for (let it = 0; it < iterations; it++) {
      const nextPr = new Map<string, number>();
      pages.forEach(p => nextPr.set(p.url, (1 - damping) / N));

      pages.forEach(source => {
        const rawOutlinks = source.extractedLinks || [];
        // Match targets in page list
        const validOutlinks = rawOutlinks.filter(targetUrl => {
          return pages.some(p => 
            p.url === targetUrl || 
            (targetUrl.startsWith('/') && p.url.endsWith(targetUrl))
          );
        });

        const currentScore = pr.get(source.url) || 0;
        if (validOutlinks.length > 0) {
          const share = (damping * currentScore) / validOutlinks.length;
          validOutlinks.forEach(targetUrl => {
            const matched = pages.find(p => 
              p.url === targetUrl || 
              (targetUrl.startsWith('/') && p.url.endsWith(targetUrl))
            );
            if (matched) {
              nextPr.set(matched.url, (nextPr.get(matched.url) || 0) + share);
            }
          });
        } else {
          // Sink node distribution
          const share = (damping * currentScore) / N;
          pages.forEach(p => {
            nextPr.set(p.url, (nextPr.get(p.url) || 0) + share);
          });
        }
      });

      pr = nextPr;
    }

    // Normalize to 1.0 - 10.0 scale for intuitive UI display
    const scores = Array.from(pr.values());
    const maxVal = Math.max(...scores, 0.0001);
    const minVal = Math.min(...scores);
    const normalized = new Map<string, number>();
    
    pr.forEach((score, url) => {
      const scaled = minVal === maxVal ? 5.0 : 1 + ((score - minVal) / (maxVal - minVal)) * 9;
      normalized.set(url, Math.round(scaled * 10) / 10);
    });

    return normalized;
  }, [pages]);

  // 2. Compute Layout Positions based on layoutPreset
  const graphData = useMemo(() => {
    const width = 1100;
    const height = 750;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodes = pages.map((page, index) => {
      const prScore = pageRankScores.get(page.url) || 5.0;
      let cx = centerX;
      let cy = centerY;

      if (customPositions[page.url]) {
        cx = customPositions[page.url].cx;
        cy = customPositions[page.url].cy;
      } else if (layoutPreset === 'organic') {
        // Root/Home in center, high PR in inner halo, others distributed by cluster
        if (index === 0) {
          cx = centerX;
          cy = centerY;
        } else {
          const angle = ((index - 1) / Math.max(pages.length - 1, 1)) * 2 * Math.PI;
          const dist = 160 + (10 - prScore) * 18 + (index % 4) * 45;
          cx = centerX + dist * Math.cos(angle);
          cy = centerY + dist * Math.sin(angle);
        }
      } else if (layoutPreset === 'radial') {
        // Concentric rings based on PageRank
        if (index === 0) {
          cx = centerX;
          cy = centerY;
        } else {
          const ring = prScore >= 7 ? 1 : prScore >= 4 ? 2 : 3;
          const ringRadius = ring === 1 ? 160 : ring === 2 ? 260 : 330;
          const angle = (index / Math.max(pages.length, 1)) * 2 * Math.PI;
          cx = centerX + ringRadius * Math.cos(angle);
          cy = centerY + ringRadius * Math.sin(angle);
        }
      } else if (layoutPreset === 'hierarchical') {
        // Tiered flow: Tier 1 (Root), Tier 2 (Services/Blog Hub), Tier 3 (Articles), Tier 4 (Leaves)
        const isRoot = index === 0;
        const isHub = page.pageType === 'Service' || page.pageType === 'AboutPage' || page.url.includes('/blog') && !page.url.replace(/\/blog\/?/, '').length;
        const isArticle = page.pageType === 'TechArticle' || page.pageType === 'Product';

        let row = isRoot ? 0 : isHub ? 1 : isArticle ? 2 : 3;
        const rowY = 120 + row * 180;
        
        // Count nodes in this row to distribute X
        const tierPages = pages.filter((p, i) => {
          if (row === 0) return i === 0;
          if (row === 1) return (p.pageType === 'Service' || p.pageType === 'AboutPage') && i !== 0;
          if (row === 2) return p.pageType === 'TechArticle' || p.pageType === 'Product';
          return true;
        });

        const tierIndex = tierPages.findIndex(p => p.url === page.url);
        const count = Math.max(tierPages.length, 1);
        cx = 160 + (tierIndex + 0.5) * ((width - 320) / count);
        cy = rowY;
      }

      return {
        url: page.url,
        title: page.title || 'Untitled Page',
        type: page.pageType,
        inlinks: page.inlinksCount || 0,
        outlinks: page.extractedLinks?.length || 0,
        issuesCount: page.issues?.length || 0,
        pageRank: prScore,
        cx,
        cy,
        page
      };
    });

    const links: { source: string; target: string; sourceNode: any; targetNode: any }[] = [];
    const nodeMap = new Map(nodes.map(n => [n.url, n]));

    pages.forEach((page) => {
      const sourceNode = nodeMap.get(page.url);
      if (sourceNode && page.extractedLinks) {
        page.extractedLinks.forEach((targetUrl) => {
          let targetNode = nodeMap.get(targetUrl);
          if (!targetNode) {
            // Match relative path
            targetNode = nodes.find(n => 
              n.url.endsWith(targetUrl) || 
              targetUrl.endsWith(n.url.replace(/^https?:\/\/[^\/]+/, ''))
            );
          }

          if (targetNode && targetNode.url !== sourceNode.url) {
            // Avoid duplicate parallel links
            const exists = links.some(l => l.source === sourceNode.url && l.target === targetNode!.url);
            if (!exists) {
              links.push({
                source: sourceNode.url,
                target: targetNode.url,
                sourceNode,
                targetNode
              });
            }
          }
        });
      }
    });

    const orphanUrls = nodes.filter(n => n.inlinks === 0 && n.url !== pages[0]?.url);

    return { nodes, links, orphanUrls };
  }, [pages, pageRankScores, layoutPreset, customPositions]);

  // Selected node
  const selectedNode = graphData.nodes.find(n => n.url === selectedUrl) || graphData.nodes[0];

  // Colors per schema type
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'TechArticle':
        return '#8b5cf6'; // Purple / Violet
      case 'Service':
        return '#3b82f6'; // Blue
      case 'AboutPage':
      case 'LocalBusiness':
        return '#10b981'; // Emerald
      case 'FAQPage':
        return '#f59e0b'; // Amber
      case 'Product':
        return '#ec4899'; // Pink
      case 'ContactPage':
        return '#06b6d4'; // Cyan
      case 'Organization':
        return '#6366f1'; // Indigo
      default:
        return '#64748b'; // Slate
    }
  };

  // Center view on specific node
  const handleCenterOnNode = useCallback((nodeUrl: string) => {
    const target = graphData.nodes.find(n => n.url === nodeUrl);
    if (!target) return;
    const centerX = 1100 / 2;
    const centerY = 750 / 2;
    setPanOffset({
      x: centerX - target.cx,
      y: centerY - target.cy
    });
    setZoom(1.2);
    setSelectedUrl(nodeUrl);
  }, [graphData.nodes]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.4), 2.8));
  };

  // Pan Canvas handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggingNodeUrl) {
      if (svgRef.current) {
        const CTM = svgRef.current.getScreenCTM();
        if (CTM) {
          const mouseX = (e.clientX - CTM.e) / CTM.a;
          const mouseY = (e.clientY - CTM.f) / CTM.d;
          
          setCustomPositions(prev => ({
            ...prev,
            [draggingNodeUrl]: { cx: mouseX, cy: mouseY }
          }));
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeUrl(null);
  };

  // Node mouse down (detect click vs drag)
  const handleNodeMouseDown = (e: React.MouseEvent, nodeUrl: string) => {
    e.stopPropagation();
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
    setDraggingNodeUrl(nodeUrl);
  };

  const handleNodeMouseUp = (e: React.MouseEvent, node: any) => {
    e.stopPropagation();
    const dx = Math.abs(e.clientX - mouseStartPos.current.x);
    const dy = Math.abs(e.clientY - mouseStartPos.current.y);

    // If movement is minimal (< 5px), trigger click
    if (dx < 5 && dy < 5) {
      setSelectedUrl(node.url);
      if (onSelectPage && node.page) {
        onSelectPage(node.page);
      }
    }
    setDraggingNodeUrl(null);
  };

  // Reset view
  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setCustomPositions({});
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter(n => {
      const matchesType = typeFilter === 'ALL' || n.type === typeFilter;
      const matchesSearch = searchQuery === '' || 
        n.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (highlightMode === 'orphans') {
        return matchesType && matchesSearch && n.inlinks === 0 && n.url !== pages[0]?.url;
      }
      return matchesType && matchesSearch;
    });
  }, [graphData.nodes, typeFilter, searchQuery, highlightMode, pages]);

  return (
    <div className={`space-y-4 ${viewMode === 'fullscreen' ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      {/* 1. Control Header & Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xs">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Internal PageRank & Link Equity Graph
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live Dynamic Mesh
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              {graphData.nodes.length} Crawled Nodes • {graphData.links.length} Internal Directed Edges • Max PR: 10.0
            </p>
          </div>
        </div>

        {/* Action Controls & Layout Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find URL in graph..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-44"
            />
          </div>

          {/* Layout Presets */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setLayoutPreset('organic')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                layoutPreset === 'organic' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Organic Force Cluster"
            >
              Organic
            </button>
            <button
              type="button"
              onClick={() => setLayoutPreset('radial')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                layoutPreset === 'radial' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Concentric PageRank Rings"
            >
              Radial PR
            </button>
            <button
              type="button"
              onClick={() => setLayoutPreset('hierarchical')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                layoutPreset === 'hierarchical' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Hierarchical Architecture Tiers"
            >
              Hierarchy
            </button>
          </div>

          {/* Highlight Mode Filter */}
          <select
            value={highlightMode}
            onChange={(e) => setHighlightMode(e.target.value as HighlightMode)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Show All Connections</option>
            <option value="inlinks">Highlight Inbound Channels</option>
            <option value="outlinks">Highlight Outbound References</option>
            <option value="orphans">Highlight Orphan Pages ({graphData.orphanUrls.length})</option>
          </select>

          {/* Flow Animation Toggle */}
          <button
            type="button"
            onClick={() => setAnimateFlow(!animateFlow)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              animateFlow 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Toggle animated PageRank equity stream"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold hidden sm:inline">Flow</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.8))}
              className="p-1 hover:bg-white text-slate-700 rounded transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
              className="p-1 hover:bg-white text-slate-700 rounded transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1 hover:bg-white text-slate-700 rounded transition-colors cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View mode toggle (Split vs Expanded vs Fullscreen) */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'expanded' ? 'split' : 'expanded')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'expanded' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={viewMode === 'expanded' ? 'Switch to Split Inspector' : 'Expand Canvas (100% width)'}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'fullscreen' ? 'split' : 'fullscreen')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'fullscreen' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={viewMode === 'fullscreen' ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}
            >
              {viewMode === 'fullscreen' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Visualization & Inspector Real Estate */}
      <div className={`grid gap-4 ${viewMode === 'expanded' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        {/* Massive SVG Graph Canvas Container */}
        <div 
          ref={containerRef}
          className={`bg-slate-950 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden relative select-none ${
            viewMode === 'expanded' ? 'col-span-1 h-[780px]' : 
            viewMode === 'fullscreen' ? 'h-[85vh]' : 
            'lg:col-span-8 xl:col-span-8 h-[680px]'
          }`}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Subtle Cyberpunk/Studio Grid Pattern Background */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Interactive SVG Stage */}
          <svg
            ref={svgRef}
            viewBox="0 0 1100 750"
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
          >
            <defs>
              {/* Arrowhead Markers */}
              <marker
                id="arrowhead-normal"
                markerWidth="8"
                markerHeight="8"
                refX="22"
                refY="4"
                orient="auto"
              >
                <polygon points="0 1, 8 4, 0 7" fill="#475569" />
              </marker>

              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="10"
                refX="24"
                refY="5"
                orient="auto"
              >
                <polygon points="0 1, 10 5, 0 9" fill="#818cf8" />
              </marker>

              <marker
                id="arrowhead-inlink"
                markerWidth="10"
                markerHeight="10"
                refX="24"
                refY="5"
                orient="auto"
              >
                <polygon points="0 1, 10 5, 0 9" fill="#10b981" />
              </marker>

              {/* Glowing Filters */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="glow-high" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Edge Dash Flow Animation Keyframes */}
              <style>
                {`
                  @keyframes linkDashFlow {
                    from { stroke-dashoffset: 24; }
                    to { stroke-dashoffset: 0; }
                  }
                  .animate-link-flow {
                    animation: linkDashFlow 1.2s linear infinite;
                  }
                  @keyframes pulseRadius {
                    0% { r: 16px; opacity: 0.8; }
                    50% { r: 28px; opacity: 0.2; }
                    100% { r: 16px; opacity: 0.8; }
                  }
                  .pulse-ring {
                    transform-origin: center;
                    transform-box: fill-box;
                  }
                `}
              </style>
            </defs>

            {/* Transform Container with Pan & Zoom */}
            <g
              transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}
              style={{ transformOrigin: '550px 375px', transition: isPanning ? 'none' : 'transform 0.15s ease-out' }}
            >
              {/* Internal Link Edges */}
              {graphData.links.map((link, i) => {
                const isDirectOut = link.source === selectedUrl;
                const isDirectIn = link.target === selectedUrl;
                const isConnected = isDirectOut || isDirectIn;
                const isHoverConnected = link.source === hoveredUrl || link.target === hoveredUrl;

                const shouldDim = (selectedUrl || hoveredUrl) && !isConnected && !isHoverConnected;
                
                // Color coding directed equity
                let strokeColor = '#334155';
                let strokeWidth = 1.2;
                let strokeOpacity = shouldDim ? 0.12 : 0.45;
                let markerId = 'url(#arrowhead-normal)';

                if (isConnected || isHoverConnected) {
                  strokeWidth = 2.4;
                  strokeOpacity = 0.95;
                  if (isDirectIn) {
                    strokeColor = '#34d399'; // Emerald inbound equity
                    markerId = 'url(#arrowhead-inlink)';
                  } else {
                    strokeColor = '#818cf8'; // Indigo outbound
                    markerId = 'url(#arrowhead-active)';
                  }
                }

                // Curved Bezier calculation
                const dx = link.targetNode.cx - link.sourceNode.cx;
                const dy = link.targetNode.cy - link.sourceNode.cy;
                const dr = Math.sqrt(dx * dx + dy * dy) * 1.3;

                return (
                  <g key={`link-${i}`} className="pointer-events-none">
                    <path
                      d={`M ${link.sourceNode.cx} ${link.sourceNode.cy} A ${dr} ${dr} 0 0 1 ${link.targetNode.cx} ${link.targetNode.cy}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      markerEnd={markerId}
                      strokeDasharray={animateFlow && (isConnected || isHoverConnected) ? '6, 6' : 'none'}
                      className={animateFlow && (isConnected || isHoverConnected) ? 'animate-link-flow' : ''}
                      style={{ transition: 'stroke 0.2s, stroke-width 0.2s, stroke-opacity 0.2s' }}
                    />
                  </g>
                );
              })}

              {/* Node Groups */}
              {graphData.nodes.map((node) => {
                const isSelected = node.url === selectedUrl;
                const isHovered = node.url === hoveredUrl;
                const isConnectedToSelected = graphData.links.some(
                  l => (l.source === selectedUrl && l.target === node.url) || 
                       (l.target === selectedUrl && l.source === node.url)
                );

                const isOrphan = node.inlinks === 0 && node.url !== pages[0]?.url;
                const isAuthorityHub = node.pageRank >= 7.5;

                // Radius dynamically scales with PageRank
                const baseRadius = 14 + (node.pageRank / 10) * 12;
                const nodeRadius = isSelected ? baseRadius + 4 : isHovered ? baseRadius + 2 : baseRadius;

                // Color calculation
                const nodeColor = getNodeColor(node.type);

                return (
                  <g
                    key={node.url}
                    transform={`translate(${node.cx}, ${node.cy})`}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.url)}
                    onMouseUp={(e) => handleNodeMouseUp(e, node)}
                    onMouseEnter={() => setHoveredUrl(node.url)}
                    onMouseLeave={() => setHoveredUrl(null)}
                    className="cursor-pointer group"
                  >
                    {/* Authority Hub Halo Glow */}
                    {isAuthorityHub && (
                      <circle
                        r={nodeRadius + 14}
                        fill="none"
                        stroke={nodeColor}
                        strokeWidth="1.5"
                        strokeOpacity="0.25"
                        filter="url(#glow-high)"
                      />
                    )}

                    {/* Orphan Warning Pulse */}
                    {isOrphan && (
                      <circle
                        r={nodeRadius + 8}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{ animationDuration: '6s' }}
                      />
                    )}

                    {/* Selected Node Ring Animation */}
                    {isSelected && (
                      <>
                        <circle
                          r={nodeRadius + 7}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="animate-spin"
                          style={{ animationDuration: '8s' }}
                        />
                        <circle
                          r={nodeRadius + 12}
                          fill="none"
                          stroke="#818cf8"
                          strokeWidth="1.5"
                          strokeOpacity="0.6"
                        />
                      </>
                    )}

                    {/* Main Node Body Circle */}
                    <circle
                      r={nodeRadius}
                      fill={nodeColor}
                      stroke={isSelected ? '#ffffff' : isHovered ? '#cbd5e1' : '#0f172a'}
                      strokeWidth={isSelected ? 3.5 : 2}
                      filter={isSelected || isHovered ? 'url(#glow)' : undefined}
                      style={{ transition: 'r 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.2s' }}
                    />

                    {/* PageRank Score Badge inside Node */}
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#ffffff"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="pointer-events-none select-none drop-shadow-sm"
                    >
                      {node.pageRank.toFixed(1)}
                    </text>

                    {/* Node URL Label */}
                    <text
                      y={nodeRadius + 14}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : isHovered ? '#f1f5f9' : '#94a3b8'}
                      fontSize={isSelected ? '11' : '10'}
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : '500'}
                      className="pointer-events-none select-none transition-colors duration-150 drop-shadow-md"
                    >
                      {node.url.replace(/https?:\/\/[^\/]+/, '') || '/ (Home)'}
                    </text>

                    {/* Inlinks Count Tag */}
                    <text
                      y={nodeRadius + 26}
                      textAnchor="middle"
                      fill={node.inlinks > 0 ? '#64748b' : '#f43f5e'}
                      fontSize="8"
                      fontFamily="monospace"
                      className="pointer-events-none select-none"
                    >
                      {node.inlinks} in • {node.outlinks} out
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* HUD Overlay in bottom left of Canvas */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs text-slate-300 p-3 rounded-xl shadow-lg flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px]">Direct Drag & Click Enabled</span>
            </div>
            <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Double-click or click node to inspect PageRank & link equity
            </div>
          </div>

          {/* Quick Hub Navigation Pills overlay on top right */}
          <div className="absolute top-4 right-4 bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono px-1">Top Hubs:</span>
            {graphData.nodes
              .sort((a, b) => b.pageRank - a.pageRank)
              .slice(0, 3)
              .map(hub => (
                <button
                  key={hub.url}
                  type="button"
                  onClick={() => handleCenterOnNode(hub.url)}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    selectedUrl === hub.url 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {hub.url.replace(/https?:\/\/[^\/]+/, '') || '/'} (PR {hub.pageRank})
                </button>
              ))}
          </div>
        </div>

        {/* 3. Deep Node Inspector & PageRank Equity Matrix (Side Panel) */}
        {viewMode !== 'expanded' && (
          <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-5">
            {selectedNode ? (
              <div className="space-y-4">
                {/* Node Title & Schema Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full border text-white shadow-2xs"
                      style={{ backgroundColor: getNodeColor(selectedNode.type), borderColor: getNodeColor(selectedNode.type) }}
                    >
                      {selectedNode.type}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      PageRank Score: <span className="text-indigo-600 font-extrabold">{selectedNode.pageRank.toFixed(1)}/10</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                    {selectedNode.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono break-all mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                    {selectedNode.url}
                  </p>
                </div>

                {/* Authority & Link Density Cards */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <div className="text-[11px] text-emerald-800 font-semibold flex items-center justify-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Inbound Equity</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                      {selectedNode.inlinks} <span className="text-xs font-normal text-emerald-600">inlinks</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                    <div className="text-[11px] text-indigo-800 font-semibold flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Outbound Flow</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-indigo-700 mt-0.5">
                      {selectedNode.outlinks} <span className="text-xs font-normal text-indigo-600">references</span>
                    </div>
                  </div>
                </div>

                {/* Orphan Warning Alert */}
                {selectedNode.inlinks === 0 && selectedNode.url !== pages[0]?.url && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Critical SEO Leak:</span> This URL has zero internal inlinks and is an orphan page. Add contextual links from relevant category clusters to pass link equity.
                    </div>
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAudit && selectedNode.page) {
                        onOpenAudit(selectedNode.page);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Technical Audit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSchema && selectedNode.page) {
                        onOpenSchema(selectedNode.page);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>JSON-LD Schema</span>
                  </button>
                </div>

                {/* Outbound References List */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>Target Outbound Pages ({selectedNode.page?.extractedLinks?.length || 0})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 scrollbar-thin">
                    {selectedNode.page?.extractedLinks && selectedNode.page.extractedLinks.length > 0 ? (
                      selectedNode.page.extractedLinks.map((target, idx) => {
                        const targetNode = graphData.nodes.find(n => 
                          n.url === target || 
                          n.url.endsWith(target) || 
                          target.endsWith(n.url.replace(/^https?:\/\/[^\/]+/, ''))
                        );

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (targetNode) {
                                setSelectedUrl(targetNode.url);
                              } else {
                                setSelectedUrl(target);
                              }
                            }}
                            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white hover:shadow-2xs text-slate-700 hover:text-indigo-600 cursor-pointer transition-all truncate"
                          >
                            <span className="truncate">→ {target.replace(/https?:\/\/[^\/]+/, '') || '/'}</span>
                            {targetNode && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 shrink-0 ml-1">
                                PR {targetNode.pageRank.toFixed(1)}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-slate-400 italic py-2 text-center">No outbound internal links found.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs italic text-center py-12">
                Select any node from the canvas to inspect its PageRank equity.
              </div>
            )}

            {/* Bottom Legend */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase font-mono mb-2">
                Schema Entity Colors
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Organization
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> TechArticle
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Service
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> About / Business
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> FAQPage
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Product / Shop
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
