'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  Layers, 
  Filter, 
  Zap, 
  ExternalLink,
  Loader2,
  TrendingUp,
  FileCode
} from 'lucide-react';
import { AISuggestion, PageMetadata } from '@/types/site-intelligence';

interface AISuggestionsViewProps {
  suggestions: AISuggestion[];
  pages: PageMetadata[];
  onRefreshSuggestions?: () => void;
}

export function AISuggestionsView({
  suggestions,
  pages,
  onRefreshSuggestions,
}: AISuggestionsViewProps) {
  const [selectedCluster, setSelectedCluster] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const clusters = Array.from(new Set(suggestions.map(s => s.topicCluster)));

  const filteredSuggestions = suggestions.filter(s => {
    return selectedCluster === 'ALL' || s.topicCluster === selectedCluster;
  });

  const handleCopyLinkTag = (sug: AISuggestion) => {
    const htmlSnippet = `<a href="${sug.targetUrl}" title="${sug.suggestedAnchor}">${sug.suggestedAnchor}</a>`;
    navigator.clipboard.writeText(htmlSnippet);
    setCopiedId(sug.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerSynthesis = async () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      if (onRefreshSuggestions) onRefreshSuggestions();
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              AI Semantic Linking & Topic Clustering
            </h3>
            <p className="text-xs text-slate-500">
              Gemini & TF-IDF algorithmic suggestions for topical relevance & search intent optimization
            </p>
          </div>
        </div>

        {/* Cluster Filter & Actions */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Topic Clusters ({suggestions.length})</option>
            {clusters.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={isSynthesizing}
            onClick={handleTriggerSynthesis}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Re-Analyze Clusters</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggestion Cards Grid */}
      {filteredSuggestions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 italic">
          No suggestions matching the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuggestions.map((sug) => {
            const isCopied = copiedId === sug.id;

            return (
              <div
                key={sug.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {sug.topicCluster}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {(sug.relevanceScore * 100).toFixed(0)}% Relevance Match
                    </span>
                  </div>

                  {/* Flow from Source to Target */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-mono space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <span className="text-slate-400 font-bold uppercase text-[9px] w-12">SOURCE:</span>
                      <span className="truncate text-slate-800">{sug.sourceUrl.replace(/https?:\/\/[^\/]+/, '') || '/'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-indigo-700 font-semibold truncate">
                      <span className="text-indigo-400 font-bold uppercase text-[9px] w-12">TARGET:</span>
                      <span className="truncate">{sug.targetUrl.replace(/https?:\/\/[^\/]+/, '') || '/'}</span>
                    </div>
                  </div>

                  {/* Anchor recommendation */}
                  <div className="text-xs">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Recommended Anchor Text: </span>
                    <div className="font-bold text-slate-900 mt-0.5 p-2 bg-indigo-50/50 rounded-md border border-indigo-100/80 font-sans">
                      &quot;{sug.suggestedAnchor}&quot;
                    </div>
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    💡 <span className="font-semibold text-slate-800">Why this matters:</span> {sug.reasoning}
                  </p>
                </div>

                {/* Footer Copy Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Ready to embed in HTML/Markdown
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyLinkTag(sug)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied HTML Tag' : 'Copy <a> Tag'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
