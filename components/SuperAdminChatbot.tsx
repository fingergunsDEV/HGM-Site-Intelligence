'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Terminal,
  GitCommit,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Maximize2,
  Minimize2,
  Cpu
} from 'lucide-react';
import { getAceOrchestrator } from '@/lib/ace-orchestrator';
import { getCiCdEngine } from '@/lib/cicd-engine';
import { AceGlobalState } from '@/types/orchestrator';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  actionBadge?: string;
}

let msgIdCounter = 0;
function createMsgId(prefix: string): string {
  msgIdCounter += 1;
  return `${prefix}-${msgIdCounter}`;
}

function getFormattedTime(): string {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface SuperAdminChatbotProps {
  onCommitPushed?: () => void;
  onGoalInjected?: () => void;
  initialIsOpen?: boolean;
  isOpenControlled?: boolean;
  onCloseControlled?: () => void;
}

export function SuperAdminChatbot({
  onCommitPushed,
  onGoalInjected,
  initialIsOpen = false,
  isOpenControlled,
  onCloseControlled
}: SuperAdminChatbotProps) {
  const [internalOpen, setInternalOpen] = useState(initialIsOpen);
  const isOpen = typeof isOpenControlled === 'boolean' ? isOpenControlled : internalOpen;

  const handleSetOpen = (openState: boolean) => {
    setInternalOpen(openState);
    if (!openState && onCloseControlled) {
      onCloseControlled();
    }
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [superAdminMode, setSuperAdminMode] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `**ACE Meta-Orchestrator & Gemini 3.8 Flash SuperAdmin initialized.**

I am your general-purpose assistant with elevated **SuperAdmin privileges**. I can:
- 🚀 **Push commits to the CI/CD pipeline** (remediating HTML, schemas, and meta tags)
- 🎯 **Inject strategic goals & constraints** into the Executive layer
- ⚡ **Orchestrate Builder & Validator agent teams** to resolve audit defects
- 📊 **Execute CLI commands** (e.g. \`/state\`, \`/agents\`, \`/telemetry\`, \`/override\`)

How may I direct the platform for you today?`,
      timestamp: 'Just now'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: MessageItem = {
      id: createMsgId('msg'),
      sender: 'user',
      text: query,
      timestamp: getFormattedTime()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/orchestrator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          executeSuperAdminAction: superAdminMode
        })
      });

      const data = await res.json();
      let actionBadge: string | undefined;

      if (data.actionTaken?.type === 'ci_commit_pushed') {
        actionBadge = '🚀 Commit Pushed to CI/CD';
        if (onCommitPushed) onCommitPushed();
      } else if (data.actionTaken?.type === 'goal_injected') {
        actionBadge = '🎯 Strategic Goal Injected';
        if (onGoalInjected) onGoalInjected();
      }

      const botMsg: MessageItem = {
        id: createMsgId('bot'),
        sender: 'assistant',
        text: data.reply || 'Cognitive control loop completed.',
        timestamp: getFormattedTime(),
        actionBadge
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: createMsgId('err'),
          sender: 'assistant',
          text: `[SuperAdmin Execution Error] Unable to complete external cognitive cycle. Fallback internal state retained.`,
          timestamp: getFormattedTime()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: '🚀 Push Commit to CI/CD', text: 'Push commit to CI/CD: Auto-remediate missing alt tags and inject LocalBusiness schema' },
    { label: '📊 /state', text: '/state' },
    { label: '🤖 /agents', text: '/agents' },
    { label: '🎯 Inject 100% Schema Goal', text: '/inject-goal "Achieve 100% Schema.org JSON-LD coverage across all pages"' },
    { label: '🛠️ Assign Builder & Validator', text: 'Assign Builder team work-builder-1 to repair heading hierarchy on all pages and request Validator sign-off' }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Trigger Button when closed */}
      {!isOpen && (
        <button
          onClick={() => handleSetOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-indigo-500/40 hover:border-indigo-400 transition-all hover:scale-105 cursor-pointer"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <span>Gemini 3.8 Flash</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/40">
                SuperAdmin
              </span>
            </div>
            <p className="text-[10px] text-slate-400">ACE Meta-Orchestrator Assistant</p>
          </div>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`flex flex-col bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[90vw] md:w-[700px] h-[80vh]'
              : 'w-[92vw] sm:w-[460px] h-[580px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white font-mono tracking-tight">
                    Gemini 3.8 Flash Assistant
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    SuperAdmin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected to 6-Layer Cognitive Loop
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title={isExpanded ? 'Minimize' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleSetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Privilege Status Banner */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-indigo-950/40 border-b border-indigo-900/40 text-[11px] text-indigo-300">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span>CI/CD Commits & Task Injection:</span>
              <span className="font-bold text-emerald-400">UNRESTRICTED</span>
            </div>
            <button
              onClick={() => setSuperAdminMode(!superAdminMode)}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono"
            >
              {superAdminMode ? 'Privilege: Elevated' : 'Privilege: Read Only'}
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs font-sans scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-mono">
                  <span>{msg.sender === 'user' ? 'Operator' : 'Gemini Flash 3.8 SuperAdmin'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {msg.actionBadge && (
                  <div className="mb-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-md text-[10px] font-bold font-mono flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-3 h-3" />
                    {msg.actionBadge}
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-xl leading-relaxed max-w-[92%] whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-xs font-mono text-[11px]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-indigo-400 text-xs font-mono animate-pulse">
                <Cpu className="w-4 h-4 animate-spin text-indigo-500" />
                <span>SuperAdmin orchestrating cognitive control loop...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp.text)}
                disabled={isLoading}
                className="px-2.5 py-1 text-[10px] font-semibold font-mono rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything or run CLI (/state, /agents, push commit)..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
