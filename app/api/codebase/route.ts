import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_CODEBASE_FILES } from '@/lib/html-codebase-engine';
import { CodebaseItem } from '@/types/site-intelligence';

// In-memory codebase store for live session
let codebaseFiles: CodebaseItem[] = [...INITIAL_CODEBASE_FILES];

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      files: codebaseFiles
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to retrieve codebase files' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, file, id, name, content, path, parentId, files } = body;

    if (action === 'reset') {
      codebaseFiles = [...INITIAL_CODEBASE_FILES];
      return NextResponse.json({ success: true, files: codebaseFiles });
    }

    if (action === 'sync' && Array.isArray(files)) {
      codebaseFiles = files;
      return NextResponse.json({ success: true, files: codebaseFiles });
    }

    if (action === 'save_file' && id) {
      const idx = codebaseFiles.findIndex(f => f.id === id);
      if (idx >= 0) {
        codebaseFiles[idx] = {
          ...codebaseFiles[idx],
          content: content !== undefined ? content : codebaseFiles[idx].content,
          size: content ? content.length : codebaseFiles[idx].size,
          lastModified: 'Just now'
        };
      } else {
        codebaseFiles.push({
          id,
          name: name || 'untitled.html',
          path: path || `/${name || 'untitled.html'}`,
          type: 'file',
          extension: name?.split('.').pop() || 'html',
          content: content || '',
          size: (content || '').length,
          parentId: parentId || 'root-dir',
          lastModified: 'Just now'
        });
      }
      return NextResponse.json({ success: true, files: codebaseFiles });
    }

    if (action === 'create_item') {
      const newItem: CodebaseItem = file || {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: name || 'new-file.html',
        path: path || `/${name || 'new-file.html'}`,
        type: body.type || 'file',
        extension: name?.split('.').pop() || 'html',
        content: content || '',
        size: (content || '').length,
        parentId: parentId || 'root-dir',
        lastModified: 'Just now'
      };
      codebaseFiles.push(newItem);
      return NextResponse.json({ success: true, item: newItem, files: codebaseFiles });
    }

    if (action === 'delete_item' && id) {
      codebaseFiles = codebaseFiles.filter(f => f.id !== id && f.parentId !== id);
      return NextResponse.json({ success: true, files: codebaseFiles });
    }

    return NextResponse.json({ success: true, files: codebaseFiles });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update codebase' },
      { status: 500 }
    );
  }
}
