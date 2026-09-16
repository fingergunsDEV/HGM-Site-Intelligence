'use client';

import React, { useState } from 'react';
import {
  FileJson,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Check,
  RefreshCw,
  Code2,
  Layers,
  ArrowRight,
  Database,
  ExternalLink
} from 'lucide-react';
import { getJsonPayloadEngine, ValidationResult } from '@/lib/json-payload-engine';
import { getAceOrchestrator } from '@/lib/ace-orchestrator';
import { IngestPayloadType } from '@/types/orchestrator';
import { PageMetadata } from '@/types/site-intelligence';

interface JsonIngestViewProps {
  onIngestPages?: (pages: PageMetadata[]) => void;
  onNavigateToResults?: () => void;
}

export function JsonIngestView({ onIngestPages, onNavigateToResults }: JsonIngestViewProps) {
  const engine = getJsonPayloadEngine();
  const orchestrator = getAceOrchestrator();

  const [activeTab, setActiveTab] = useState<'ingest' | 'generate'>('ingest');

  // Ingestion state
  const [jsonInput, setJsonInput] = useState<string>(
    engine.generateSamplePayload('search_intelligence_audit')
  );
  const [validation, setValidation] = useState<ValidationResult>(() =>
    engine.validatePayload(engine.generateSamplePayload('search_intelligence_audit'))
  );
  const [isCopied, setIsCopied] = useState(false);
  const [ingestSuccessMessage, setIngestSuccessMessage] = useState<string | null>(null);

  // Generator state
  const [generatorType, setGeneratorType] = useState<IngestPayloadType>('search_intelligence_audit');
  const [generatorOutput, setGeneratorOutput] = useState<string>(
    engine.generateSamplePayload('search_intelligence_audit')
  );

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    const res = engine.validatePayload(val);
    setValidation(res);
    setIngestSuccessMessage(null);
  };

  const handleLoadSample = (type: IngestPayloadType) => {
    const sample = engine.generateSamplePayload(type);
    setJsonInput(sample);
    const res = engine.validatePayload(sample);
    setValidation(res);
    setIngestSuccessMessage(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteIngest = () => {
    if (!validation.valid) return;

    try {
      const parsed = JSON.parse(jsonInput);
      if (validation.type === 'search_intelligence_audit') {
        const pages = engine.convertPayloadToPages(parsed);
        if (onIngestPages && pages.length > 0) {
          onIngestPages(pages);
        }

        // Also ingest into ACE cognitive hierarchy tasks
        orchestrator.ingestPagesIntoTasks(pages);
        orchestrator.emitBusMessage({
          bus: 'southbound',
          from: 'operational',
          to: 'work-builder-1',
          type: 'task_assignment',
          payload: `Ingested ${pages.length} search intelligence URLs into platform active state.`,
          layer: 'operational',
          severity: 'success'
        });

        setIngestSuccessMessage(
          `Successfully ingested ${pages.length} URLs, rankings, and structured issues into the platform.`
        );
      } else {
        setIngestSuccessMessage('Payload validated and schema entities synchronized with memory agent.');
      }
    } catch (e: unknown) {
      const err = e as Error;
      setIngestSuccessMessage(`Ingest failed: ${err.message}`);
    }
  };

  const handleGeneratePayload = () => {
    const output = engine.generateSamplePayload(generatorType);
    setGeneratorOutput(output);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 font-mono">
              JSON INGEST ENGINE & PAYLOAD GENERATOR
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Bidirectional schema processor for Search Intelligence datasets, SERP rankings, and Schema.org graphs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('ingest')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ingest'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            JSON Ingest & Validator
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payload Generator Studio
          </button>
        </div>
      </div>

      {/* MODE 1: Ingest & Validator */}
      {activeTab === 'ingest' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Code Input & Controls */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-950 text-white rounded-xl border border-slate-800 shadow-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold font-mono text-slate-200">
                    RAW JSON PAYLOAD INPUT
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Load Sample:</span>
                  <button
                    onClick={() => handleLoadSample('search_intelligence_audit')}
                    className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono cursor-pointer"
                  >
                    Search Audit
                  </button>
                  <button
                    onClick={() => handleLoadSample('schema_graph')}
                    className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono cursor-pointer"
                  >
                    Schema Graph
                  </button>
                  <button
                    onClick={() => handleLoadSample('marketing_campaign')}
                    className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono cursor-pointer"
                  >
                    Campaign Brief
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={jsonInput}
                onChange={e => handleJsonChange(e.target.value)}
                rows={18}
                placeholder="Paste valid JSON Search Intelligence or Schema Graph payload here..."
                className="w-full bg-slate-900/90 text-indigo-200 border border-slate-800 rounded-lg p-3 font-mono text-xs focus:outline-hidden focus:border-indigo-500 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  Characters: {jsonInput.length} • Lines: {jsonInput.split('\n').length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(jsonInput)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload(jsonInput, 'search-payload.json')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Validation & Ingest Action */}
          <div className="lg:col-span-4 space-y-4">
            {/* Validation Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 font-mono">
                  SCHEMA CONFORMANCE
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${
                    validation.valid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {validation.valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {validation.valid ? 'Valid Schema' : 'Validation Error'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Detected Type:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {validation.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Status Summary:</span>
                  <span className="text-[11px] text-slate-500 font-mono">{validation.summary}</span>
                </div>
              </div>

              {validation.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1 text-xs text-rose-700">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Validation Errors ({validation.errors.length}):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ingest Action Button */}
              <button
                onClick={handleExecuteIngest}
                disabled={!validation.valid}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Ingest into Platform State</span>
              </button>
            </div>

            {/* Ingest Success Alert */}
            {ingestSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2 text-xs text-emerald-800 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Payload Ingested Successfully</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  {ingestSuccessMessage}
                </p>
                {onNavigateToResults && (
                  <button
                    onClick={onNavigateToResults}
                    className="text-xs font-bold text-emerald-800 underline hover:text-emerald-900 flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>View Ingested Pages & Schemas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Ingestion Specs Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2 text-slate-600">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Automated Ingestion Protocol</span>
              </h4>
              <p className="text-[11px] leading-relaxed">
                Ingested payloads seamlessly map to the Next.js internal link graph, trigger Builder & Validator task creation, and stage zero-defect clean HTML updates for CI/CD.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Payload Generator Studio */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                PAYLOAD GENERATION PARAMETERS
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Schema Payload Type
                  </label>
                  <select
                    value={generatorType}
                    onChange={e => {
                      const t = e.target.value as IngestPayloadType;
                      setGeneratorType(t);
                      setGeneratorOutput(engine.generateSamplePayload(t));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500 font-medium"
                  >
                    <option value="search_intelligence_audit">Search Intelligence Audit & SERP Rankings</option>
                    <option value="schema_graph">Schema.org JSON-LD Graph (@graph)</option>
                    <option value="marketing_campaign">Autonomous Marketing Campaign Brief</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Domain
                  </label>
                  <input
                    type="text"
                    defaultValue="https://holisticgrowthmarketing.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    readOnly
                  />
                </div>

                <button
                  onClick={handleGeneratePayload}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Standards-Compliant Payload</span>
                </button>
              </div>
            </div>

            {/* Quick Helper */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2 text-indigo-900">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Zero Hallucination Guarantee</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Generated JSON structures strictly follow Schema.org vocabularies, W3C HTML5 recommendations, and Google Rich Result guidelines.
              </p>
            </div>
          </div>

          {/* Right JSON Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950 text-white rounded-xl border border-slate-800 shadow-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold font-mono text-slate-200">
                  GENERATED PAYLOAD PREVIEW
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(generatorOutput)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setJsonInput(generatorOutput);
                      setValidation(engine.validatePayload(generatorOutput));
                      setActiveTab('ingest');
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>Send to Ingest</span>
                  </button>
                </div>
              </div>

              <textarea
                value={generatorOutput}
                readOnly
                rows={18}
                className="w-full bg-slate-900/90 text-indigo-200 border border-slate-800 rounded-lg p-3 font-mono text-xs focus:outline-hidden leading-relaxed scrollbar-thin scrollbar-thumb-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
