'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Code2,
  RefreshCw
} from 'lucide-react';
import { getCiCdEngine } from '@/lib/cicd-engine';
import { getAceOrchestrator } from '@/lib/ace-orchestrator';
import { CiCdCommit, PipelineStage } from '@/types/orchestrator';

export function CicdPipelineView() {
  const cicdEngine = getCiCdEngine();
  const orchestrator = getAceOrchestrator();

  const [commits, setCommits] = useState<CiCdCommit[]>(cicdEngine.getCommits());
  const [selectedBranch, setSelectedBranch] = useState(cicdEngine.getActiveBranch());
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('fix(seo): remediate missing alt tags & inject schema json-ld');
  const [expandedCommitId, setExpandedCommitId] = useState<string | null>(commits[0]?.id || null);

  useEffect(() => {
    const unsubscribe = cicdEngine.subscribe(newCommits => {
      setCommits(newCommits);
      if (!expandedCommitId && newCommits.length > 0) {
        setExpandedCommitId(newCommits[0].id);
      }
    });
    return () => unsubscribe();
  }, [cicdEngine, expandedCommitId]);

  const handlePushCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    const commit = cicdEngine.pushCommit({
      message: commitMessage,
      author: 'SuperAdmin Gemini Flash 3.8',
      authorRole: 'SuperAdmin',
      branch: selectedBranch,
      filesChanged: ['src/pages/index.html', 'src/schemas/generated-schema.json', 'src/config/seo-rules.json']
    });

    orchestrator.emitBusMessage({
      bus: 'southbound',
      from: 'superadmin-gemini',
      to: 'operational',
      type: 'ci_commit',
      payload: `Dispatched CI/CD commit [${commit.hash}]: "${commit.message}" on branch ${selectedBranch}.`,
      layer: 'operational',
      severity: 'success'
    });

    orchestrator.addTelemetry(`Dispatched CI/CD commit ${commit.hash}`, 'superadmin-gemini', 'success');

    setIsPushModalOpen(false);
    setCommitMessage('fix(seo): remediate missing alt tags & inject schema json-ld');
    setExpandedCommitId(commit.id);
  };

  const activeCommit = commits.find(c => c.id === expandedCommitId) || commits[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 font-mono">
              CI/CD PIPELINE & AUTOMATED DEPLOYMENT
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Automated verification stages for clean HTML remediation, Schema.org conformance, and zero-downtime deployments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Branch Switcher */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
            <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedBranch}
              onChange={e => {
                setSelectedBranch(e.target.value);
                cicdEngine.setActiveBranch(e.target.value);
              }}
              className="bg-transparent font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="main">branch: main</option>
              <option value="staging">branch: staging</option>
              <option value="agent-fix/schema-remediation">branch: agent-fix/*</option>
            </select>
          </div>

          {/* Trigger Commit Button */}
          <button
            onClick={() => setIsPushModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Push SuperAdmin Commit</span>
          </button>
        </div>
      </div>

      {/* Push Commit Modal */}
      {isPushModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <GitCommit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Push Commit to CI/CD Pipeline</h3>
                  <p className="text-xs text-slate-500">SuperAdmin elevated privileges will dispatch build and verification stages.</p>
                </div>
              </div>
              <button
                onClick={() => setIsPushModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePushCommit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Commit Message
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  placeholder="feat(seo): auto-remediate missing alt attributes and inject LocalBusiness schema..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Automated Verification Gates</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  This commit will be subjected to strict TypeScript AST checking, Schema.org syntax certification, SEO regression tests, and Validator agent sign-off.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPushModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Push Commit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Active Pipeline Runner */}
      {activeCommit && (
        <div className="bg-slate-950 text-white rounded-xl border border-slate-800 shadow-lg p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                commit {activeCommit.hash}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white font-mono">{activeCommit.message}</h3>
                <p className="text-xs text-slate-400">
                  Author: <span className="text-indigo-400 font-semibold">{activeCommit.author}</span> • Branch:{' '}
                  <span className="font-mono text-slate-300">{activeCommit.branch}</span> • {activeCommit.timestamp}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase flex items-center gap-1.5 ${
                  activeCommit.status === 'passed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}
              >
                {activeCommit.status === 'passed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {activeCommit.status}
              </span>
            </div>
          </div>

          {/* 5 Sequential Stages */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {activeCommit.stages.map((stage, idx) => (
              <div
                key={stage.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                  stage.status === 'passed'
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : stage.status === 'running'
                    ? 'bg-indigo-950/50 border-indigo-500 shadow-md animate-pulse'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">Stage {idx + 1}</span>
                  {stage.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : stage.status === 'running' ? (
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-600" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white font-mono leading-tight">{stage.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-snug pt-1">{stage.description}</p>
                </div>

                <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                  <span>Status:</span>
                  <span
                    className={
                      stage.status === 'passed'
                        ? 'text-emerald-400 font-bold'
                        : stage.status === 'running'
                        ? 'text-indigo-400 font-bold'
                        : 'text-slate-500'
                    }
                  >
                    {stage.status} {stage.durationMs ? `(${stage.durationMs}ms)` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Stage Terminal Logs */}
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>BUILD & STAGE TELEMETRY LOGS</span>
              </div>
              <span className="text-[10px]">Auto-Scroll Enabled</span>
            </div>
            <div className="font-mono text-[11px] text-emerald-400 space-y-1 max-h-36 overflow-y-auto pt-1">
              {activeCommit.stages.flatMap(s => s.logs).map((log, lIdx) => (
                <div key={lIdx}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Commit History Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-mono">
            COMMIT & DEPLOYMENT HISTORY ({commits.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Cloud Run Container Deployments</span>
        </div>

        <div className="space-y-2">
          {commits.map(commit => (
            <div
              key={commit.id}
              onClick={() => setExpandedCommitId(commit.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                expandedCommitId === commit.id
                  ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-mono text-xs font-bold">
                  {commit.hash.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 font-mono">{commit.message}</span>
                    {commit.autoRemediated && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                        Auto-Remediated
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{commit.author}</span> • Branch: {commit.branch} • {commit.timestamp}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  {commit.filesChanged.length} files changed
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    commit.status === 'passed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {commit.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
