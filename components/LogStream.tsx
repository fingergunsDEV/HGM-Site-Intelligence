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
        return 'text-[#f28b82] bg-[#3c1e1e] border-[#5c2e2e]';
      case 'WARN':
        return 'text-[#fdd663] bg-[#3c321e] border-[#5c4e2e]';
      case 'SUCCESS':
        return 'text-[#81c995] bg-[#1e3c27] border-[#2e5c3a]';
      case 'DEBUG':
        return 'text-[#9aa0a6] bg-[#303134] border-[#3c4043]';
      case 'INFO':
      default:
        return 'text-[#8ab4f8] bg-[#1e2a3c] border-[#2e3e5c]';
    }
  };

  return (
    <div className="bg-[#202124] rounded-lg border border-[#dadce0] overflow-hidden flex flex-col h-[380px]">
      {/* Terminal Header */}
      <div className="bg-white px-4 py-2.5 border-b border-[#dadce0] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#202124]">
          <Terminal className="w-4 h-4 text-[#1a73e8]" />
          <span className="font-medium">Live Audit Log Stream</span>
          <span className="text-[#5f6368] text-[11px]">({filteredLogs.length} events)</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3 h-3 text-[#5f6368] absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter logs..."
              className="pl-7 pr-2 py-1 bg-white border border-[#dadce0] rounded text-[11px] text-[#202124] focus:outline-none focus:border-[#1a73e8] w-28 sm:w-36"
            />
          </div>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-white border border-[#dadce0] text-[#3c4043] rounded px-2 py-1 text-[11px] font-medium focus:outline-none focus:border-[#1a73e8]"
          >
            <option value="ALL">ALL</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="SUCCESS">SUCCESS</option>
          </select>

          {/* Auto-scroll checkbox */}
          <label className="flex items-center gap-1.5 text-[11px] text-[#5f6368] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8] h-3.5 w-3.5"
            />
            <span className="hidden sm:inline">Auto-scroll</span>
          </label>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded transition-colors"
            title="Copy logs to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#1e8e3e]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={onClearLogs}
            className="p-1 text-[#5f6368] hover:text-[#d93025] hover:bg-[#f1f3f4] rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed space-y-1 bg-[#202124]"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#80868b] italic">
            No log events to display. Start a crawl to inspect your site.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 hover:bg-[#2d2e30] py-0.5 px-1 rounded transition-colors">
              <span 
                className="text-[#80868b] select-none text-[10px] sm:text-[11px] whitespace-nowrap font-mono"
                suppressHydrationWarning
              >
                {isClient ? log.timestamp : '--:--:--'}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border uppercase tracking-wider whitespace-nowrap ${getLevelBadgeClass(log.level)}`}>
                {log.level}
              </span>
              <span className={`flex-1 break-all ${
                log.level === 'ERROR' ? 'text-[#f28b82]' :
                log.level === 'WARN' ? 'text-[#fdd663]' :
                log.level === 'SUCCESS' ? 'text-[#81c995]' :
                'text-[#e8eaed]'
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
