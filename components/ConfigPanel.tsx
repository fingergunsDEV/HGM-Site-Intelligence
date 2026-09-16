'use client';

import React, { useState } from 'react';
import { 
  Sliders, 
  Settings2, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Upload, 
  HelpCircle, 
  Info,
  Clock,
  Zap,
  FolderOpen
} from 'lucide-react';
import { CrawlConfig } from '@/types/site-intelligence';

interface ConfigPanelProps {
  config: CrawlConfig;
  setConfig: React.Dispatch<React.SetStateAction<CrawlConfig>>;
  isRunning: boolean;
}

export function ConfigPanel({ config, setConfig, isRunning }: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'performance' | 'modules' | 'advanced'>('general');

  const handleInputChange = (field: keyof CrawlConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Settings Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'general'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          General
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'performance'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Performance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'modules'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Modules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'advanced'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Advanced
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-4 sm:p-5">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            {/* Live Remote Engine Indicator */}
            <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Live Enterprise Crawl Engine</h4>
                  <p className="text-[11px] text-indigo-200/70">
                    Real-time remote HTTP fetching, DOM parsing, structured data generation & technical SEO audit
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Sitemap Source (URL or local path)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => {
                      handleInputChange('sitemap', 'https://holisticgrowthmarketing.com/sitemap.xml');
                      handleInputChange('base_url', 'https://holisticgrowthmarketing.com');
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer underline underline-offset-2"
                  >
                    Use holisticgrowthmarketing.com sitemap
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.sitemap}
                  onChange={(e) => handleInputChange('sitemap', e.target.value)}
                  placeholder="https://example.com/sitemap.xml or /path/to/sitemap.txt"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => alert('You can also upload and edit sitemaps in the Codebase & HTML Editor tab.')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  title="Upload local sitemap file"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard XML sitemaps, nested sitemap indexes, or plaintext URL lists are supported.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Base URL (Target Domain)
                </label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.base_url}
                  onChange={(e) => handleInputChange('base_url', e.target.value)}
                  placeholder="https://holisticgrowthmarketing.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Output Directory
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isRunning}
                    value={config.output_dir}
                    onChange={(e) => handleInputChange('output_dir', e.target.value)}
                    placeholder="./schemas"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
                  />
                  <FolderOpen className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Settings */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Request Delay (Throttle)
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {config.delay.toFixed(1)}s per request
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                disabled={isRunning}
                value={config.delay}
                onChange={(e) => handleInputChange('delay', parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.1s (Fast / Low overhead)</span>
                <span>1.0s (Polite default)</span>
                <span>3.0s (Strict rate limit)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Concurrency (Workers)
                </label>
                <select
                  disabled={isRunning}
                  value={config.concurrency}
                  onChange={(e) => handleInputChange('concurrency', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
                >
                  <option value={1}>1 Worker (Sequential)</option>
                  <option value={2}>2 Parallel Workers</option>
                  <option value={4}>4 Parallel Workers</option>
                  <option value={8}>8 High-Throughput Workers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cache Directory
                </label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.cache_dir}
                  onChange={(e) => handleInputChange('cache_dir', e.target.value)}
                  placeholder="./html_cache"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-800">--no-fetch</div>
                  <div className="text-[10px] text-slate-500">Only parse locally cached HTML files</div>
                </div>
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={config.no_fetch}
                  onChange={(e) => handleInputChange('no_fetch', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-800">--no-cache</div>
                  <div className="text-[10px] text-slate-500">Bypass cache & fetch fresh response</div>
                </div>
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={config.no_cache}
                  onChange={(e) => handleInputChange('no_cache', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* Module Toggles */}
        {activeTab === 'modules' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer">
              <div className="pr-2">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  SEO Audit Engine
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Check meta titles, descriptions, H1 hierarchy, canonical tags & missing alt texts.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.audit}
                onChange={(e) => handleInputChange('audit', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
            </label>

            <label className="flex items-start justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer">
              <div className="pr-2">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Internal Link Graph
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Extract directed edge graph, detect orphan pages & calculate internal PageRank flow.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.link_graph}
                onChange={(e) => handleInputChange('link_graph', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
            </label>

            <label className="flex items-start justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer">
              <div className="pr-2">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  AI Suggestions & Clusters
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Compute semantic topic clusters and find high-intent cross-linking opportunities.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.ai_suggest}
                onChange={(e) => handleInputChange('ai_suggest', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
            </label>

            <label className="flex items-start justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer">
              <div className="pr-2">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  Schema Generator & Validation
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Emit JSON-LD for TechArticle, LocalBusiness, FAQPage, Organization and Product.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.schema_fix}
                onChange={(e) => handleInputChange('schema_fix', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
            </label>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Max Pages Cap
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  disabled={isRunning}
                  value={config.max_pages}
                  onChange={(e) => handleInputChange('max_pages', parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Exclude Path Patterns
                </label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.exclude_paths || ''}
                  onChange={(e) => handleInputChange('exclude_paths', e.target.value)}
                  placeholder="/admin, /cart, /checkout, /login"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Custom User-Agent
              </label>
              <input
                type="text"
                disabled={isRunning}
                value={config.user_agent}
                onChange={(e) => handleInputChange('user_agent', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL Filter Regex (Optional)
              </label>
              <input
                type="text"
                disabled={isRunning}
                value={config.url_filter_regex || ''}
                onChange={(e) => handleInputChange('url_filter_regex', e.target.value)}
                placeholder="^https:\/\/holisticgrowthmarketing\.com\/(blog|services)\/.*"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 disabled:opacity-60"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
