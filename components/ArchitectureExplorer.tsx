'use client';

import React, { useState } from 'react';
import { 
  FolderTree, 
  FileCode2, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  Server, 
  Globe, 
  Cpu, 
  Code,
  Download
} from 'lucide-react';
import { PROJECT_FILES, ProjectFile } from '@/lib/project-architecture';

export function ArchitectureExplorer() {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PROJECT_FILES[2]); // backend/main.py
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const categories = ['ALL', 'backend', 'modules', 'routes', 'frontend', 'components', 'root'];

  const filteredFiles = PROJECT_FILES.filter(f => {
    if (selectedCategory === 'ALL') return true;
    return f.category === selectedCategory;
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'backend':
      case 'routes':
      case 'modules':
        return <Server className="w-3.5 h-3.5 text-blue-500" />;
      case 'frontend':
      case 'components':
      case 'hooks':
        return <Globe className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <FileCode2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <FolderTree className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Full-Stack Repository Architecture Explorer
            </h3>
            <p className="text-xs text-slate-500">
              Complete directory blueprint and source files for FastAPI Python backend & React Vite frontend
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Explorer Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left File Tree Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-3 shadow-xs max-h-[560px] overflow-y-auto space-y-1 scrollbar-thin">
          <div className="text-[11px] font-mono uppercase font-bold text-slate-400 px-2 py-1">
            Files ({filteredFiles.length})
          </div>

          {filteredFiles.map((file) => {
            const isSelected = selectedFile.path === file.path;

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-semibold shadow-2xs'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <span className="mt-0.5 shrink-0">{getCategoryIcon(file.category)}</span>
                <div className="truncate flex-1">
                  <div className="truncate font-mono text-[11px]">{file.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{file.path}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Code Inspector */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[560px]">
          {/* File Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-200 font-mono font-bold">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>{selectedFile.path}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedFile.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied File' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Body */}
          <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-indigo-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
            <pre className="select-all">
              {selectedFile.codeSnippet}
            </pre>
          </div>

          {/* File Footer */}
          <div className="bg-slate-900/90 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Category: <strong className="text-slate-300 uppercase">{selectedFile.category}</strong></span>
            <span>Production Blueprint v2.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
