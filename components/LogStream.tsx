'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  ArrowDownCircle, 
  Filter
} from 'lucide-react';
import { LogMessage, LogLevel } from '@/types/site-intelligence';

interface LogStreamProps {
  logs: LogMessage[];
  onClearLogs: () => void;
}

const emptySubscribe = () => () => {};

export function LogStream({ logs, onClearLogs }: LogStreamProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
    const matchesSearch = 
      searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.url && log.url.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const handleCopyLogs = () => {
    const formatted = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      case 'WARN':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'SUCCESS':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      case 'DEBUG':
        return 'text-slate-400 bg-slate-800/60 border-slate-700';
      case 'INFO':
      default:
        return 'text-sky-400 bg-sky-950/60 border-sky-800/80';
    }
  };

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[380px]">
      {/* Terminal Header */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold">Live Crawl & Audit Log Stream</span>
          <span className="text-slate-500 text-[11px]">({filteredLogs.length} events)</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter logs..."
              className="pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 font-mono w-28 sm:w-36"
            />
          </div>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ALL</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="SUCCESS">SUCCESS</option>
          </select>

          {/* Auto-scroll checkbox */}
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 h-3.5 w-3.5"
            />
            <span className="hidden sm:inline">Auto-scroll</span>
          </label>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy logs to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={onClearLogs}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 italic">
            No log events to display. Start a live crawl to inspect your site.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/50 py-0.5 px-1 rounded transition-colors">
              <span 
                className="text-slate-500 select-none text-[10px] sm:text-[11px] whitespace-nowrap font-mono"
                suppressHydrationWarning
              >
                {isClient ? log.timestamp : '--:--:--'}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap ${getLevelBadgeClass(log.level)}`}>
                {log.level}
              </span>
              <span className={`flex-1 break-all ${
                log.level === 'ERROR' ? 'text-rose-300' :
                log.level === 'WARN' ? 'text-amber-200' :
                log.level === 'SUCCESS' ? 'text-emerald-300' :
                'text-slate-300'
              }`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
