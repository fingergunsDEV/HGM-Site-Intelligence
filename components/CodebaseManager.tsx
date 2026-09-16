'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FolderTree, 
  FileCode2, 
  Folder, 
  FolderPlus, 
  FilePlus, 
  Trash2, 
  Save, 
  Sparkles, 
  Search, 
  Play, 
  ExternalLink, 
  Eye, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Download, 
  Upload, 
  RefreshCw, 
  Mail, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Copy, 
  Check, 
  Smartphone, 
  Monitor, 
  Settings2,
  FileText,
  FileJson,
  Braces
} from 'lucide-react';
import { CodebaseItem, PageMetadata, SmtpConfig, CrawlSummary } from '@/types/site-intelligence';
import { 
  parseAndAuditHtml, 
  injectTitle, 
  injectMetaDescription, 
  injectCanonical, 
  injectOpenGraph, 
  injectJsonLd, 
  fixMissingImageAlts, 
  INITIAL_CODEBASE_FILES 
} from '@/lib/html-codebase-engine';
import JSZip from 'jszip';

interface CodebaseManagerProps {
  onPushPageToCrawler: (page: PageMetadata) => void;
  onOpenSmtpModalForPage?: (page: PageMetadata) => void;
  onOpenAuditDrawer?: (page: PageMetadata) => void;
  onOpenSchemaModal?: (page: PageMetadata) => void;
  smtpConfig?: SmtpConfig;
}

export function CodebaseManager({
  onPushPageToCrawler,
  onOpenSmtpModalForPage,
  onOpenAuditDrawer,
  onOpenSchemaModal,
  smtpConfig
}: CodebaseManagerProps) {
  // File tree state
  const [files, setFiles] = useState<CodebaseItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('site_intel_codebase_files');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return INITIAL_CODEBASE_FILES;
        }
      }
    }
    return INITIAL_CODEBASE_FILES;
  });

  const [selectedFileId, setSelectedFileId] = useState<string>('file-index-html');

  // Find currently active file
  const activeFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId) || files.find(f => f.type === 'file') || files[1];
  }, [files, selectedFileId]);


  const [editorContent, setEditorContent] = useState<string>(() => {
    const initial = files.find(f => f.id === 'file-index-html') || files[1];
    return initial?.content || '';
  });
  const [isModified, setIsModified] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'root-dir': true,
    'dir-services': true,
    'dir-blog': true
  });

  // Editor View Mode: 'code' | 'preview' | 'split'
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'split'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedCode, setCopiedCode] = useState(false);

  // Active File Audit State
  const [currentAudit, setCurrentAudit] = useState<PageMetadata | null>(() => {
    const initial = files.find(f => f.id === 'file-index-html') || files[1];
    if (initial?.content && (initial.name.endsWith('.html') || initial.name.endsWith('.htm'))) {
      return parseAndAuditHtml(initial.content, initial.path);
    }
    return null;
  });
  const [isAuditing, setIsAuditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // New item creation state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [targetParentFolderId, setTargetParentFolderId] = useState<string>('root-dir');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to switch active file cleanly without useEffect
  const handleSelectFile = (fileId: string) => {
    const targetFile = files.find(f => f.id === fileId);
    if (!targetFile || targetFile.type !== 'file') return;

    setSelectedFileId(fileId);
    setEditorContent(targetFile.content || '');
    setIsModified(false);

    if (targetFile.name.endsWith('.html') || targetFile.name.endsWith('.htm')) {
      const audit = parseAndAuditHtml(targetFile.content || '', targetFile.path);
      setCurrentAudit(audit);
    } else {
      setCurrentAudit(null);
    }
  };


  // Save files to local storage
  const persistFiles = (updatedFiles: CodebaseItem[]) => {
    setFiles(updatedFiles);
    if (typeof window !== 'undefined') {
      localStorage.setItem('site_intel_codebase_files', JSON.stringify(updatedFiles));
    }
  };

  // Run audit on current editor content
  const handleRunAudit = () => {
    if (!activeFile) return;
    setIsAuditing(true);
    setTimeout(() => {
      const audit = parseAndAuditHtml(editorContent, activeFile.path);
      setCurrentAudit(audit);
      setIsAuditing(false);
    }, 150);
  };

  // Save active file changes
  const handleSaveFile = () => {
    if (!activeFile) return;
    const updated = files.map(f => {
      if (f.id === activeFile.id) {
        return {
          ...f,
          content: editorContent,
          size: editorContent.length,
          lastModified: 'Just now'
        };
      }
      return f;
    });
    persistFiles(updated);
    setIsModified(false);
    setSaveStatus('Saved successfully');
    setTimeout(() => setSaveStatus(null), 2000);

    // Refresh audit
    if (activeFile.name.endsWith('.html')) {
      const audit = parseAndAuditHtml(editorContent, activeFile.path);
      setCurrentAudit(audit);
    }
  };

  // One-click SEO fixes
  const handleFixCanonical = () => {
    if (!activeFile) return;
    const domain = 'https://holisticgrowthmarketing.com';
    const canonicalUrl = `${domain}${activeFile.path.startsWith('/') ? activeFile.path : '/' + activeFile.path}`;
    const fixed = injectCanonical(editorContent, canonicalUrl);
    setEditorContent(fixed);
    setIsModified(true);
    setCurrentAudit(parseAndAuditHtml(fixed, activeFile.path));
  };

  const handleFixMetaDescription = () => {
    if (!activeFile) return;
    const defaultDesc = `High-impact technical SEO strategies and structured data engineering for ${activeFile.name.replace('.html', '')}. Optimize crawl efficiency and rankings.`;
    const fixed = injectMetaDescription(editorContent, defaultDesc);
    setEditorContent(fixed);
    setIsModified(true);
    setCurrentAudit(parseAndAuditHtml(fixed, activeFile.path));
  };

  const handleFixMissingAlts = () => {
    if (!activeFile) return;
    const fixed = fixMissingImageAlts(editorContent, `Technical illustration for ${activeFile.name.replace('.html', '')}`);
    setEditorContent(fixed);
    setIsModified(true);
    setCurrentAudit(parseAndAuditHtml(fixed, activeFile.path));
  };

  const handleInjectSchema = () => {
    if (!activeFile || !currentAudit) return;
    const fixed = injectJsonLd(editorContent, currentAudit.schemaJson);
    setEditorContent(fixed);
    setIsModified(true);
    setCurrentAudit(parseAndAuditHtml(fixed, activeFile.path));
  };

  const handleFixOpenGraph = () => {
    if (!activeFile || !currentAudit) return;
    const domain = 'https://holisticgrowthmarketing.com';
    const pageUrl = `${domain}${activeFile.path.startsWith('/') ? activeFile.path : '/' + activeFile.path}`;
    const fixed = injectOpenGraph(editorContent, {
      title: currentAudit.title || activeFile.name,
      description: currentAudit.metaDescription || 'Enterprise growth marketing and search intelligence.',
      url: pageUrl,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200'
    });
    setEditorContent(fixed);
    setIsModified(true);
    setCurrentAudit(parseAndAuditHtml(fixed, activeFile.path));
  };

  // Push audited page to main platform crawler
  const handlePushToCrawler = () => {
    if (!currentAudit) return;
    onPushPageToCrawler(currentAudit);
    setSaveStatus('Pushed to Platform Crawler & Graph');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Create new file
  const handleCreateFile = () => {
    if (!newItemName.trim()) return;
    let fileName = newItemName.trim();
    if (!fileName.includes('.')) fileName += '.html';
    
    const parent = files.find(f => f.id === targetParentFolderId);
    const parentPath = parent && parent.path !== '/' ? parent.path : '';
    const newPath = `${parentPath}/${fileName}`;

    const defaultContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName.replace('.html', '').replace(/-/g, ' ')} | Holistic Growth Marketing</title>
  <meta name="description" content="Discover actionable strategies for ${fileName.replace('.html', '').replace(/-/g, ' ')}.">
  <link rel="canonical" href="https://holisticgrowthmarketing.com${newPath}">
</head>
<body>
  <h1>${fileName.replace('.html', '').replace(/-/g, ' ')}</h1>
  <p>New content page ready for technical SEO auditing and schema generation.</p>
</body>
</html>`;

    const newFile: CodebaseItem = {
      id: `file-${Date.now()}`,
      name: fileName,
      path: newPath,
      type: 'file',
      extension: fileName.split('.').pop() || 'html',
      parentId: targetParentFolderId,
      content: defaultContent,
      size: defaultContent.length,
      lastModified: 'Just now'
    };

    const updated = [...files, newFile];
    persistFiles(updated);
    handleSelectFile(newFile.id);
    setIsCreatingFile(false);
    setNewItemName('');
  };

  // Create new folder
  const handleCreateFolder = () => {
    if (!newItemName.trim()) return;
    const folderName = newItemName.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    const parent = files.find(f => f.id === targetParentFolderId);
    const parentPath = parent && parent.path !== '/' ? parent.path : '';
    const newPath = `${parentPath}/${folderName}`;

    const newFolder: CodebaseItem = {
      id: `dir-${Date.now()}`,
      name: folderName,
      path: newPath,
      type: 'directory',
      parentId: targetParentFolderId
    };

    const updated = [...files, newFolder];
    persistFiles(updated);
    setExpandedFolders(prev => ({ ...prev, [newFolder.id]: true }));
    setIsCreatingFolder(false);
    setNewItemName('');
  };

  // Delete item
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'root-dir' || id === 'file-index-html') {
      alert('Root files and index.html cannot be deleted.');
      return;
    }
    if (confirm('Are you sure you want to delete this file/directory?')) {
      const updated = files.filter(f => f.id !== id && f.parentId !== id);
      persistFiles(updated);
      if (selectedFileId === id) {
        handleSelectFile('file-index-html');
      }
    }
  };

  // Upload file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const newFile: CodebaseItem = {
          id: `file-upload-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: file.name,
          path: `/${file.name}`,
          type: 'file',
          extension: file.name.split('.').pop() || 'html',
          parentId: 'root-dir',
          content: text,
          size: text.length,
          lastModified: 'Just now'
        };

        setFiles(prev => {
          const updated = [...prev, newFile];
          if (typeof window !== 'undefined') {
            localStorage.setItem('site_intel_codebase_files', JSON.stringify(updated));
          }
          return updated;
        });
        handleSelectFile(newFile.id);
      };
      reader.readAsText(file);
    });
  };


  // Download project as ZIP
  const handleExportZip = async () => {
    const zip = new JSZip();
    files.forEach(f => {
      if (f.type === 'file' && f.content !== undefined) {
        const cleanPath = f.path.startsWith('/') ? f.path.substring(1) : f.path;
        zip.file(cleanPath, f.content);
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-codebase-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(editorContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Recursive tree rendering
  const renderTreeItems = (parentId: string | null = 'root-dir', depth: number = 0): React.ReactNode => {
    let items = files.filter(f => f.parentId === parentId);
    if (items.length === 0 && depth === 0) {
      items = files;
    }

    return items
      .filter(item => {
        if (!searchQuery.trim()) return true;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               item.path.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .map(item => {
        const isDir = item.type === 'directory';
        const isExpanded = expandedFolders[item.id] ?? true;
        const isSelected = selectedFileId === item.id;

        return (
          <div key={item.id} className="space-y-0.5">
            <div
              onClick={() => {
                if (isDir) {
                  toggleFolder(item.id);
                } else {
                  handleSelectFile(item.id);
                }
              }}
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
              className={`flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs font-mono transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate min-w-0">
                {isDir ? (
                  <span className="text-slate-400 group-hover:text-slate-600">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                ) : null}

                {isDir ? (
                  <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                ) : item.name.endsWith('.html') ? (
                  <FileCode2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />
                ) : item.name.endsWith('.xml') ? (
                  <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                ) : item.name.endsWith('.json') ? (
                  <FileJson className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-yellow-500'}`} />
                ) : (
                  <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                )}

                <span className="truncate">{item.name}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isDir && (
                  <button
                    type="button"
                    title="New File Inside This Folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetParentFolderId(item.id);
                      setIsCreatingFile(true);
                    }}
                    className={`p-1 rounded ${isSelected ? 'hover:bg-indigo-700 text-white' : 'hover:bg-slate-200 text-slate-500'}`}
                  >
                    <FilePlus className="w-3 h-3" />
                  </button>
                )}

                {item.id !== 'root-dir' && item.id !== 'file-index-html' && (
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className={`p-1 rounded ${isSelected ? 'hover:bg-rose-700 text-white' : 'hover:bg-rose-100 text-rose-500'}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {isDir && isExpanded && (
              <div>{renderTreeItems(item.id, depth + 1)}</div>
            )}
          </div>
        );
      });
  };


  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Codebase & Directory File Manager
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                HTML & SEO Editor
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Edit codebase files, audit pages directly, inject schemas/meta tags, and dispatch reports via SMTP relay.
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            accept=".html,.htm,.css,.js,.json,.xml,.txt"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={handleExportZip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Codebase ZIP</span>
          </button>

          {activeFile && (
            <button
              type="button"
              onClick={handleSaveFile}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer ${
                isModified ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isModified ? 'Save Changes *' : 'Saved'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveStatus && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between font-medium animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveStatus}</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600">Local State Synced</span>
        </div>
      )}

      {/* 2. Main Workspace: File Tree (Left) + Code & Audit Editor (Center) + Live Audit Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: File Tree & Directory Navigator */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800">
                <Folder className="w-4 h-4 text-indigo-600" />
                <span>EXPLORER</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="New File"
                  onClick={() => {
                    setTargetParentFolderId('root-dir');
                    setIsCreatingFile(true);
                  }}
                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="New Folder"
                  onClick={() => {
                    setTargetParentFolderId('root-dir');
                    setIsCreatingFolder(true);
                  }}
                  className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* New File Inline Form */}
            {isCreatingFile && (
              <div className="p-2 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2 text-xs">
                <div className="font-semibold text-indigo-900 text-[11px]">Create New HTML / Asset File:</div>
                <input
                  type="text"
                  placeholder="page-name.html"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFile();
                    if (e.key === 'Escape') setIsCreatingFile(false);
                  }}
                  autoFocus
                  className="w-full px-2 py-1 bg-white border border-indigo-300 rounded text-xs font-mono focus:outline-none"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFile(false)}
                    className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFile}
                    className="px-2.5 py-1 text-[11px] bg-indigo-600 text-white font-semibold rounded cursor-pointer"
                  >
                    Create File
                  </button>
                </div>
              </div>
            )}

            {/* New Folder Inline Form */}
            {isCreatingFolder && (
              <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-xs">
                <div className="font-semibold text-amber-900 text-[11px]">Create Directory Folder:</div>
                <input
                  type="text"
                  placeholder="directory-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setIsCreatingFolder(false);
                  }}
                  autoFocus
                  className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono focus:outline-none"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="px-2.5 py-1 text-[11px] bg-amber-600 text-white font-semibold rounded cursor-pointer"
                  >
                    Create Folder
                  </button>
                </div>
              </div>
            )}

            {/* Directory File Tree View */}
            <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {renderTreeItems('root-dir')}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Code / HTML Editor & Snippet Toolbar */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden flex flex-col min-h-[560px]">
            {/* Editor File Bar */}
            <div className="bg-slate-950 p-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2 font-mono">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200">{activeFile?.name || 'No file selected'}</span>
                <span className="text-[11px] text-slate-500">{activeFile?.path}</span>
                {isModified && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                )}
              </div>

              {/* View Switcher: Code / Split / Preview */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setViewMode('code')}
                  className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                    viewMode === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 inline mr-1" />
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                    viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 inline mr-1" />
                  Split
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                    viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  Live Preview
                </button>
              </div>
            </div>

            {/* Quick SEO Snippet Insertion Bar */}
            <div className="bg-slate-800/90 px-3 py-1.5 border-b border-slate-700/60 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-mono text-[10px] font-semibold uppercase mr-1">
                Quick Inject:
              </span>
              <button
                type="button"
                onClick={handleFixCanonical}
                className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-indigo-300 font-mono transition-colors cursor-pointer"
                title="Inject <link rel='canonical'>"
              >
                + Canonical
              </button>
              <button
                type="button"
                onClick={handleFixMetaDescription}
                className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-indigo-300 font-mono transition-colors cursor-pointer"
                title="Inject <meta name='description'>"
              >
                + Description
              </button>
              <button
                type="button"
                onClick={handleInjectSchema}
                className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-yellow-300 font-mono transition-colors cursor-pointer"
                title="Inject JSON-LD Schema"
              >
                + JSON-LD
              </button>
              <button
                type="button"
                onClick={handleFixMissingAlts}
                className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-emerald-300 font-mono transition-colors cursor-pointer"
                title="Fix all <img> missing alt tags"
              >
                + Alt Attributes
              </button>
              <button
                type="button"
                onClick={handleFixOpenGraph}
                className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-cyan-300 font-mono transition-colors cursor-pointer"
                title="Inject OpenGraph meta tags"
              >
                + OpenGraph
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className="ml-auto px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-mono transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code / Preview Main Canvas */}
            <div className="flex-1 grid grid-cols-1 relative min-h-[440px]">
              {/* CODE EDITOR VIEW */}
              {(viewMode === 'code' || viewMode === 'split') && (
                <div className={`relative flex flex-col ${viewMode === 'split' ? 'border-b border-slate-800' : ''}`}>
                  <textarea
                    value={editorContent}
                    onChange={(e) => {
                      setEditorContent(e.target.value);
                      setIsModified(true);
                    }}
                    onBlur={handleRunAudit}
                    placeholder="Enter or paste HTML / code here..."
                    className="w-full h-full min-h-[300px] p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-indigo-500/40"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* LIVE PREVIEW IFRAME VIEW */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className="p-3 bg-slate-950/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                    <span>Live Render Preview ({previewDevice})</span>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                      >
                        <Monitor className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                      >
                        <Smartphone className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <iframe
                      srcDoc={editorContent}
                      title="HTML Preview"
                      sandbox="allow-scripts"
                      className={`bg-white rounded-lg border border-slate-700 shadow-lg transition-all ${
                        previewDevice === 'mobile' ? 'w-[320px] h-[360px]' : 'w-full h-[220px]'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Editor Bottom Status Bar */}
            <div className="bg-slate-950 px-3 py-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span>{editorContent.split('\n').length} lines</span>
                <span>{editorContent.length} chars</span>
                <span>{(editorContent.length / 1024).toFixed(1)} KB</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} />
                  <span>Re-Audit Page</span>
                </button>
                <span>UTF-8 • HTML5</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Technical SEO Audit & Direct Actions */}
        <div className="lg:col-span-3 space-y-3">
          {currentAudit ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 font-mono">
                    LIVE PAGE AUDIT
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  {currentAudit.pageType}
                </span>
              </div>

              {/* Health Score Metric */}
              <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Health Index:</span>
                  <span className={`text-sm font-bold ${
                    currentAudit.issues.filter(i => i.type === 'critical').length === 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {currentAudit.issues.filter(i => i.type === 'critical').length === 0 ? '95 / 100' : '52 / 100'}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      currentAudit.issues.filter(i => i.type === 'critical').length === 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${currentAudit.issues.filter(i => i.type === 'critical').length === 0 ? 95 : 52}%`
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                  <span>{currentAudit.issues.filter(i => i.type === 'critical').length} Critical</span>
                  <span>{currentAudit.issues.filter(i => i.type === 'warning').length} Warnings</span>
                  <span>{currentAudit.wordCount} words</span>
                </div>
              </div>

              {/* Tag Checklist */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Technical Tags Status:
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span>Title Tag:</span>
                  <span className={`font-bold ${currentAudit.title ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentAudit.title ? 'Present' : 'Missing'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span>Meta Description:</span>
                  <span className={`font-bold ${currentAudit.metaDescription ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentAudit.metaDescription ? 'Present' : 'Missing'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span>Canonical Link:</span>
                  <span className={`font-bold ${currentAudit.canonicalUrl ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {currentAudit.canonicalUrl ? 'Configured' : 'Missing'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span>JSON-LD Schema:</span>
                  <span className={`font-bold ${currentAudit.schemaValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {currentAudit.schemaValid ? 'Valid' : 'Incomplete'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span>Image Alt Status:</span>
                  <span className={`font-bold ${(currentAudit.imagesWithoutAlt || 0) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {(currentAudit.imagesWithoutAlt || 0) === 0 ? 'All Passed' : `${currentAudit.imagesWithoutAlt} Missing`}
                  </span>
                </div>
              </div>

              {/* Detected Issues List */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Audit Issues ({currentAudit.issues.length}):
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin">
                  {currentAudit.issues.length === 0 ? (
                    <div className="p-2 rounded bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>All audit checks passed.</span>
                    </div>
                  ) : (
                    currentAudit.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border text-[11px] ${
                          issue.type === 'critical'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : issue.type === 'warning'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="font-bold font-mono text-[10px]">{issue.code}</div>
                        <div className="text-[11px] leading-tight mt-0.5">{issue.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePushToCrawler}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Push to Site Crawler & Graph</span>
                </button>

                {onOpenSmtpModalForPage && (
                  <button
                    type="button"
                    onClick={() => onOpenSmtpModalForPage(currentAudit)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Email Audit via SMTP</span>
                  </button>
                )}

                {onOpenAuditDrawer && (
                  <button
                    type="button"
                    onClick={() => onOpenAuditDrawer(currentAudit)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Open AI Remediation Drawer</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-400">
              Select an HTML file to display real-time technical SEO audits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
