
import React, { useState, useEffect } from 'react';
import { FileDiffIcon, FileCode, Check, Cpu } from 'lucide-react';
import { FileDiff } from '../types';

interface CodeDiffViewerProps {
  diffs: FileDiff[];
  nodeVersion?: string;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ diffs, nodeVersion }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    // Reset selection when diffs change, select first by default
    if (diffs && diffs.length > 0) {
        setSelectedFile(diffs[0].fileName);
    } else {
        setSelectedFile(null);
    }
  }, [diffs]);

  const activeDiff = diffs.find(d => d.fileName === selectedFile) || diffs[0];

  if (!diffs || diffs.length === 0) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-white">
            <FileCode size={32} className="opacity-20" />
            <p className="text-sm">No code changes recorded for this step.</p>
        </div>
    );
  }

  // Very basic helper to split lines and find diffs for display
  const renderLines = (content: string, type: 'original' | 'modified') => {
      if (!content) return null;
      return content.split('\n').map((line, i) => {
          let className = "px-4";
          // Simple highlighting logic (not a real diff engine but good enough for demo)
          if (type === 'modified' && activeDiff?.originalContent && !activeDiff.originalContent.includes(line.trim())) {
              className += " bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500 block";
          }
          
          return (
             <div key={i} className={className}>
                 {type === 'modified' && className.includes('bg-emerald-50') && <span className="text-emerald-500 mr-2 select-none">+</span>}
                 {line}
             </div>
          );
      });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex h-full">
       
       {/* File Sidebar */}
       <div className="w-48 md:w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
             <span>Modified Files</span>
             <span className="bg-gray-200 px-1.5 rounded-full text-[10px] text-gray-600">{diffs.length}</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
             {diffs.map((diff) => (
                 <button
                    key={diff.fileName}
                    onClick={() => setSelectedFile(diff.fileName)}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-mono truncate flex items-center justify-between group transition-colors ${
                        activeDiff?.fileName === diff.fileName 
                        ? 'bg-blue-50 text-blue-700 font-bold' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={diff.fileName}
                 >
                    <span className="truncate">{diff.fileName.split('/').pop()}</span>
                    {activeDiff?.fileName === diff.fileName && <Check size={10} />}
                 </button>
             ))}
          </div>
       </div>

       {/* Main Diff Area */}
       <div className="flex-1 flex flex-col min-w-0">
            {/* Header with Node Version */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                    <FileDiffIcon size={16} />
                    <span className="text-xs font-mono font-bold">{activeDiff?.fileName}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-gray-500">Environment:</span>
                    <span className="text-emerald-700 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <Cpu size={12} />
                        Node {nodeVersion || 'Latest'}
                    </span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200 overflow-hidden">
                <div className="bg-gray-50/50 overflow-auto py-2">
                    <div className="px-4 text-xs text-red-600 mb-2 font-bold uppercase sticky top-0 bg-gray-50/90 py-1 backdrop-blur-sm z-10 border-b border-red-200">Original</div>
                    <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
                        {activeDiff?.originalContent}
                    </pre>
                </div>
                <div className="bg-white overflow-auto py-2 relative">
                    <div className="px-4 text-xs text-emerald-600 mb-2 font-bold uppercase sticky top-0 bg-white/90 py-1 backdrop-blur-sm z-10 border-b border-emerald-200">Refactored</div>
                    <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap leading-relaxed">
                        {renderLines(activeDiff?.modifiedContent, 'modified')}
                    </pre>
                </div>
            </div>
       </div>
    </div>
  );
};

export default CodeDiffViewer;