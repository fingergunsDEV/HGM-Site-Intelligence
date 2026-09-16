'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Terminal,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  GitCommit,
  UserCheck,
  Users,
  Activity,
  ArrowDown,
  ArrowUp,
  Sliders,
  Scale,
  Zap,
  Target,
  Lock,
  Flame,
  ChevronRight,
  Crown
} from 'lucide-react';
import { getAceOrchestrator } from '@/lib/ace-orchestrator';
import { AceGlobalState, DualBusMessage } from '@/types/orchestrator';
import { useUserAccount, isOwnerUser, SUPER_ADMIN_EMAILS } from '@/lib/auth-storage';

interface OrchestratorViewProps {
  onOpenSuperAdminChat?: () => void;
  onNavigateToDashboard?: () => void;
}

export function OrchestratorView({ 
  onOpenSuperAdminChat,
  onNavigateToDashboard 
}: OrchestratorViewProps) {
  const currentUser = useUserAccount();
  const isSuperAdmin = isOwnerUser(currentUser);
  const [showAdminDiagnostics, setShowAdminDiagnostics] = useState(false);

  const orchestrator = getAceOrchestrator();
  const [state, setState] = useState<AceGlobalState>(orchestrator.getState());
  const [busMessages, setBusMessages] = useState<DualBusMessage[]>(orchestrator.getBusMessages());
  const [busFilter, setBusFilter] = useState<'all' | 'southbound' | 'northbound'>('all');
  const [cliInput, setCliInput] = useState('');
  const [cliOutput, setCliOutput] = useState<string>('ACE Command Shell Ready. Type /help for available commands.');
  const [newGoalInput, setNewGoalInput] = useState('');
  const [isInjectingGoal, setIsInjectingGoal] = useState(false);

  useEffect(() => {
    const unsubscribe = orchestrator.subscribe(newState => {
      setState(newState);
      setBusMessages(orchestrator.getBusMessages());
    });
    return () => unsubscribe();
  }, [orchestrator]);

  const handleRunCycle = () => {
    orchestrator.runCognitiveCycle('Manual turn triggered by operator.');
  };

  const handleExecuteCli = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cliInput.trim()) return;

    const res = orchestrator.executeAdminCommand(cliInput);
    setCliOutput(`> ${cliInput}\n\n${res.output}`);
    setCliInput('');
  };

  const handleInjectGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    orchestrator.executeAdminCommand(`/inject-goal "${newGoalInput}"`);
    setNewGoalInput('');
    setIsInjectingGoal(false);
  };

  const filteredBus = busMessages.filter(m => {
    if (busFilter === 'all') return true;
    return m.bus === busFilter;
  });

  // If not in admin diagnostics mode, show the Inaccessible / In-Development state
  if (!showAdminDiagnostics) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Under Development Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-8 sm:p-12 border border-cyan-500/20 shadow-2xl text-white">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>In Development • Inaccessible</span>
            </div>

            {/* Main Title */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                ACE Orchestrator
              </h2>
              <p className="text-sm sm:text-base text-cyan-200/80 font-mono">
                Autonomous Cognitive Entity 6-Layer Architecture
              </p>
            </div>

            {/* Explanation */}
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
              The Autonomous Cognitive Entity (ACE) multi-agent orchestrator is currently inaccessible while its dedicated compute allocation, token throughput metrics, and pricing models are established.
            </p>

            {/* Development Milestones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Phase 1: Architecture</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  6-layer hierarchy and dual-bus cognitive feedback telemetry established.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2 ring-1 ring-cyan-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 font-mono">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Phase 2: Pricing Model</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Establishing compute unit costs per cognitive turn and token metering.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 font-mono">
                  <Clock className="w-4 h-4" />
                  <span>Phase 3: Public Release</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  General availability release once sustainable token pricing is deployed.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  Return to Dashboard & Audits
                </button>
              )}

              {/* Super Admin Preview Override */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAdminDiagnostics(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Super Admin Dev Preview</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Super Admin Dev Preview View
  return (
    <div className="space-y-6">
      {/* Super Admin Notice Bar */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>SUPER ADMIN DEV PREVIEW — ACE Orchestrator is locked for general users pending pricing model finalization.</span>
        </div>
        <button
          type="button"
          onClick={() => setShowAdminDiagnostics(false)}
          className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded hover:bg-amber-400 transition-colors cursor-pointer"
        >
          Exit Preview
        </button>
      </div>

      {/* Top Cockpit KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">COGNITIVE TURN</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            Turn #{state.turn}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Loop active & synchronized
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">ASPIRATIONAL LAW</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {state.mission_state.aspirational_alignment}%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            0 Drift / All Constraints Met
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">BUILDER TEAM</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {state.agent_state.builder_throughput}%
          </div>
          <div className="text-[11px] text-slate-500">
            work-builder-1 & 2 throughput
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">VALIDATOR ACCURACY</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {state.agent_state.validator_accuracy}%
          </div>
          <div className="text-[11px] text-blue-600 font-medium">
            audit-validator-1 sign-off rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">CONTROL ACTIONS</span>
            <Sliders className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleRunCycle}
              className="flex-1 py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Play className="w-3 h-3 text-cyan-400" />
              <span>Step Turn</span>
            </button>
            {onOpenSuperAdminChat && (
              <button
                type="button"
                onClick={onOpenSuperAdminChat}
                className="py-1.5 px-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Open Assistant"
              >
                <Sparkles className="w-3 h-3 text-cyan-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dual-Bus Live Stream & Layer Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Layer Hierarchy (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>6-LAYER ACE COGNITIVE HIERARCHY</span>
              </h3>
              <p className="text-xs text-slate-500">
                Aspirational law flows Southbound (commands); reality telemetry flows Northbound (sensors).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsInjectingGoal(!isInjectingGoal)}
              className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-cyan-600" />
              <span>Inject Goal</span>
            </button>
          </div>

          {/* Goal Injection Drawer */}
          {isInjectingGoal && (
            <form onSubmit={handleInjectGoal} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
              <label className="block text-xs font-semibold text-slate-700">
                Inject Top-Level Mission Goal (L2 Global Strategy):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  placeholder="e.g. Optimize all missing Schema JSON-LD and eliminate duplicate H1s"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Send
                </button>
              </div>
            </form>
          )}

          {/* Layers Accordion / Stack */}
          <div className="space-y-2.5">
            {state.layers.map(layer => (
              <div
                key={layer.level}
                className={`p-3.5 rounded-xl border transition-all ${
                  layer.status === 'active'
                    ? 'border-cyan-500/40 bg-cyan-50/20'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-[11px] font-mono font-bold flex items-center justify-center">
                      L{layer.level}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{layer.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                          layer.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {layer.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {layer.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-800">
                      Turn #{layer.cycle_count}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(layer.last_updated).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {layer.active_task && (
                  <div className="mt-2 text-[11px] bg-white p-2 rounded-lg border border-slate-200 text-slate-700 font-mono flex items-center justify-between">
                    <span className="truncate">Task: {layer.active_task}</span>
                    <span className="text-[10px] text-cyan-600 shrink-0 ml-2 font-bold">
                      telemetry: OK
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dual-Bus Telemetry Stream & CLI Shell (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dual Bus Stream */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 text-white p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>DUAL-BUS TELEMETRY</span>
              </h3>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setBusFilter('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${busFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                >
                  ALL
                </button>
                <button
                  type="button"
                  onClick={() => setBusFilter('southbound')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${busFilter === 'southbound' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  SOUTH ↓
                </button>
                <button
                  type="button"
                  onClick={() => setBusFilter('northbound')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${busFilter === 'northbound' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  NORTH ↑
                </button>
              </div>
            </div>

            <div className="h-64 overflow-y-auto space-y-2 pr-1 text-xs font-mono">
              {filteredBus.length === 0 ? (
                <div className="text-slate-500 text-center py-8">No bus activity recorded yet.</div>
              ) : (
                filteredBus.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded border text-[11px] leading-tight ${
                      msg.bus === 'southbound'
                        ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200'
                        : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                      <span className="font-bold flex items-center gap-1">
                        {msg.bus === 'southbound' ? <ArrowDown className="w-3 h-3 text-indigo-400" /> : <ArrowUp className="w-3 h-3 text-emerald-400" />}
                        {msg.from} → {msg.to}
                      </span>
                      <span>Turn #{msg.turn}</span>
                    </div>
                    <div className="font-semibold text-white">{msg.type}</div>
                    <div className="text-[10px] opacity-90 mt-0.5 line-clamp-2">
                      {typeof msg.payload === 'string' 
                        ? msg.payload 
                        : ((msg.payload as any)?.command || (msg.payload as any)?.summary || JSON.stringify(msg.payload))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Admin Command CLI Shell */}
          <div className="bg-black rounded-xl border border-slate-800 p-4 space-y-3 text-white font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ACE Diagnostic Shell
              </span>
              <span>v2.4-debug</span>
            </div>

            <div className="h-32 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-900 text-slate-300 text-[11px] whitespace-pre-wrap">
              {cliOutput}
            </div>

            <form onSubmit={handleExecuteCli} className="flex gap-2">
              <span className="text-cyan-400 py-1.5">$</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="/help, /status, /turn, /layers, /reset"
                className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none placeholder:text-slate-600 font-mono"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded text-xs font-bold cursor-pointer"
              >
                Run
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
