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
    <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden">
      {/* Settings Tab Navigation */}
      <div className="flex border-b border-[#dadce0] bg-[#f8fafd] p-1.5 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
            activeTab === 'general'
              ? 'bg-white text-[#1a73e8] border border-[#dadce0] shadow-2xs'
              : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          General
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
            activeTab === 'performance'
              ? 'bg-white text-[#1a73e8] border border-[#dadce0] shadow-2xs'
              : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Performance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
            activeTab === 'modules'
              ? 'bg-white text-[#1a73e8] border border-[#dadce0] shadow-2xs'
              : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Modules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
            activeTab === 'advanced'
              ? 'bg-white text-[#1a73e8] border border-[#dadce0] shadow-2xs'
              : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
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
            <div className="p-3 bg-[#f8fafd] border border-[#d2e3fc] text-[#202124] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#1a73e8]" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#202124]">Enterprise Crawl Engine</h4>
                  <p className="text-[11px] text-[#5f6368]">
                    Real-time remote HTTP fetching, DOM parsing, structured data generation & technical SEO audit
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                ACTIVE
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#3c4043]">
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
                    className="text-[11px] text-[#1a73e8] hover:text-[#1557b0] font-medium cursor-pointer"
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
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => alert('You can also upload and edit sitemaps in the Codebase & HTML Editor tab.')}
                  className="px-3 py-2 bg-white hover:bg-[#f8fafd] border border-[#dadce0] text-[#3c4043] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  title="Upload local sitemap file"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>
              <p className="text-[11px] text-[#5f6368] mt-1">
                Standard XML sitemaps, nested sitemap indexes, or plaintext URL lists are supported.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#3c4043] mb-1.5">
                  Base URL (Target Domain)
                </label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.base_url}
                  onChange={(e) => handleInputChange('base_url', e.target.value)}
                  placeholder="https://holisticgrowthmarketing.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3c4043] mb-1.5">
                  Output Directory
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isRunning}
                    value={config.output_dir}
                    onChange={(e) => handleInputChange('output_dir', e.target.value)}
                    placeholder="./schemas"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
                  />
                  <FolderOpen className="w-4 h-4 text-[#5f6368] absolute right-3 top-2.5 pointer-events-none" />
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
                <label className="text-xs font-medium text-[#3c4043] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#5f6368]" />
                  Request Delay (Throttle)
                </label>
                <span className="text-xs font-medium text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded border border-[#d2e3fc]">
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
                className="w-full accent-[#1a73e8] h-2 bg-[#e8eaed] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5f6368] mt-1">
                <span>0.1s (Fast / Low overhead)</span>
                <span>1.0s (Polite default)</span>
                <span>3.0s (Strict rate limit)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#3c4043] mb-1.5">
                  Concurrency (Workers)
                </label>
                <select
                  disabled={isRunning}
                  value={config.concurrency}
                  onChange={(e) => handleInputChange('concurrency', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
                >
                  <option value={1}>1 Worker (Sequential)</option>
                  <option value={2}>2 Parallel Workers</option>
                  <option value={4}>4 Parallel Workers</option>
                  <option value={8}>8 High-Throughput Workers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3c4043] mb-1.5">
                  Cache Directory
                </label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.cache_dir}
                  onChange={(e) => handleInputChange('cache_dir', e.target.value)}
                  placeholder="./html_cache"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#dadce0]">
              <label className="flex items-center justify-between p-2.5 rounded-md border border-[#dadce0] hover:bg-[#f8fafd] cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-[#202124]">--no-fetch</div>
                  <div className="text-[10px] text-[#5f6368]">Only parse locally cached HTML files</div>
                </div>
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={config.no_fetch}
                  onChange={(e) => handleInputChange('no_fetch', e.target.checked)}
                  className="rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-md border border-[#dadce0] hover:bg-[#f8fafd] cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-[#202124]">--no-cache</div>
                  <div className="text-[10px] text-[#5f6368]">Bypass cache & fetch fresh response</div>
                </div>
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={config.no_cache}
                  onChange={(e) => handleInputChange('no_cache', e.target.checked)}
                  className="rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
                />
              </label>
            </div>
          </div>
        )}

        {/* Module Toggles */}
        {activeTab === 'modules' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start justify-between p-3 rounded-md border border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f8fafd] transition-all cursor-pointer">
              <div className="pr-2">
                <div className="text-xs font-medium text-[#202124] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1a73e8]" />
                  SEO Audit Engine
                </div>
                <p className="text-[11px] text-[#5f6368] mt-0.5">
                  Check meta titles, descriptions, H1 hierarchy, canonical tags & missing alt texts.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.audit}
                onChange={(e) => handleInputChange('audit', e.target.checked)}
                className="mt-0.5 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
              />
            </label>

            <label className="flex items-start justify-between p-3 rounded-md border border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f8fafd] transition-all cursor-pointer">
              <div className="pr-2">
                <div className="text-xs font-medium text-[#202124] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1a73e8]" />
                  Internal Link Graph
                </div>
                <p className="text-[11px] text-[#5f6368] mt-0.5">
                  Extract directed edge graph, detect orphan pages & calculate internal PageRank flow.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.link_graph}
                onChange={(e) => handleInputChange('link_graph', e.target.checked)}
                className="mt-0.5 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
              />
            </label>

            <label className="flex items-start justify-between p-3 rounded-md border border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f8fafd] transition-all cursor-pointer">
              <div className="pr-2">
                <div className="text-xs font-medium text-[#202124] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#1a73e8]" />
                  AI Suggestions & Clusters
                </div>
                <p className="text-[11px] text-[#5f6368] mt-0.5">
                  Compute semantic topic clusters and find high-intent cross-linking opportunities.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.ai_suggest}
                onChange={(e) => handleInputChange('ai_suggest', e.target.checked)}
                className="mt-0.5 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
              />
            </label>

            <label className="flex items-start justify-between p-3 rounded-md border border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f8fafd] transition-all cursor-pointer">
              <div className="pr-2">
                <div className="text-xs font-medium text-[#202124] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#1a73e8]" />
                  Schema Generator & Validation
                </div>
                <p className="text-[11px] text-[#5f6368] mt-0.5">
                  Emit JSON-LD for TechArticle, LocalBusiness, FAQPage, Organization and Product.
                </p>
              </div>
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.schema_fix}
                onChange={(e) => handleInputChange('schema_fix', e.target.checked)}
                className="mt-0.5 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] h-4 w-4"
              />
            </label>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#3c4043] mb-1.5">
                  Max Pages Cap
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  disabled={isRunning}
                  value={config.max_pages}
                  onChange={(e) => handleInputChange('max_pages', parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3c4043] mb-1.5">
                  Exclude Path Patterns
                </label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.exclude_paths || ''}
                  onChange={(e) => handleInputChange('exclude_paths', e.target.value)}
                  placeholder="/admin, /cart, /checkout, /login"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3c4043] mb-1.5">
                Custom User-Agent
              </label>
              <input
                type="text"
                disabled={isRunning}
                value={config.user_agent}
                onChange={(e) => handleInputChange('user_agent', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3c4043] mb-1.5">
                URL Filter Regex (Optional)
              </label>
              <input
                type="text"
                disabled={isRunning}
                value={config.url_filter_regex || ''}
                onChange={(e) => handleInputChange('url_filter_regex', e.target.value)}
                placeholder="^https:\/\/holisticgrowthmarketing\.com\/(blog|services)\/.*"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-[#202124] disabled:opacity-60"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
