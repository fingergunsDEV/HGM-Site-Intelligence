'use client';

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  FileCode2, 
  Layers, 
  Loader2,
  ExternalLink,
  Code,
  Lock,
  Crown
} from 'lucide-react';
import { PageMetadata } from '@/types/site-intelligence';

interface SchemaModalProps {
  page: PageMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSchema?: (url: string, newSchema: Record<string, any>) => void;
  isPro?: boolean;
  onOpenSubscriptionModal?: (reason: 'copy' | 'export' | 'limit' | 'general') => void;
}

export function SchemaModal({ 
  page, 
  isOpen, 
  onClose, 
  onUpdateSchema,
  isPro = false,
  onOpenSubscriptionModal
}: SchemaModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [customSchema, setCustomSchema] = useState<Record<string, any> | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'visual'>('code');

  if (!isOpen || !page) return null;

  const currentSchema = customSchema || page.schemaJson || {};
  const schemaString = JSON.stringify(currentSchema, null, 2);

  const handleCopy = () => {
    if (!isPro) {
      if (onOpenSubscriptionModal) onOpenSubscriptionModal('copy');
      return;
    }
    const fullSnippet = `<script type="application/ld+json">\n${schemaString}\n</script>`;
    navigator.clipboard.writeText(fullSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!isPro) {
      if (onOpenSubscriptionModal) onOpenSubscriptionModal('export');
      return;
    }
    const blob = new Blob([schemaString], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `${page.url.replace(/https?:\/\//, '').replace(/[\/\?#]/g, '_')}.jsonld`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };


  const handleGeminiEnhance = async () => {
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fix-schema',
          pageData: page,
          existingSchema: currentSchema
        })
      });
      const data = await res.json();
      if (data?.schema) {
        setCustomSchema(data.schema);
        if (onUpdateSchema) {
          onUpdateSchema(page.url, data.schema);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  JSON-LD Structured Data Schema
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Valid Schema.org
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono truncate max-w-md">
                {page.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'code' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
                }`}
              >
                Code (JSON-LD)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'visual' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
                }`}
              >
                Visual Triples
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          {viewMode === 'code' ? (
            <div className="relative">
              <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-t-lg border-b border-slate-800 flex justify-between items-center">
                <span>&lt;script type=&quot;application/ld+json&quot;&gt;</span>
                <span className="text-indigo-400 font-semibold">{currentSchema['@type']} Entity</span>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto rounded-b-lg border border-slate-900 max-h-[380px] select-all">
                {schemaString}
              </pre>
            </div>
          ) : (
            /* Visual Entity Explorer */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary Entity</span>
                  <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{currentSchema['@type']}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{currentSchema['@id']}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Headline / Name</span>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">{currentSchema['headline'] || currentSchema['name']}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{currentSchema['inLanguage'] || 'en-US'}</div>
                </div>
              </div>

              {currentSchema.publisher && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Publisher / Author Organization</span>
                  <div className="text-sm font-semibold text-slate-800 mt-1">
                    {typeof currentSchema.publisher === 'object' ? currentSchema.publisher.name : currentSchema.publisher}
                  </div>
                  <div className="text-xs text-indigo-600 font-mono mt-0.5">
                    {typeof currentSchema.publisher === 'object' ? currentSchema.publisher.url : ''}
                  </div>
                </div>
              )}

              {currentSchema.mainEntity && Array.isArray(currentSchema.mainEntity) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    FAQ Q&A Entities ({currentSchema.mainEntity.length} Questions)
                  </span>
                  {currentSchema.mainEntity.map((qa: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                      <div className="font-bold text-slate-900">{qa.name}</div>
                      <div className="text-slate-600 mt-1">{qa.acceptedAnswer?.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={isEnhancing}
            onClick={handleGeminiEnhance}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enhancing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Enhance Entity Graph</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Tag' : 'Copy <script> Tag'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .jsonld</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
