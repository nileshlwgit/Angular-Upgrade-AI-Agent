import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: LogEntry[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'command': return 'text-blue-700 font-bold';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <TerminalIcon size={16} />
          <span className="text-xs font-mono font-bold uppercase">Agent Operations Log</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-1 bg-white"
      >
        {logs.length === 0 && (
          <div className="text-gray-400 italic">Waiting for agent initiation...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-fade-in">
            <span className="text-gray-400 shrink-0 select-none">
              [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]
            </span>
            <span className="text-purple-600 shrink-0 w-24 font-bold select-none">
              {log.agent}
            </span>
            <span className={`${getLogColor(log.type)} break-all`}>
              {log.type === 'command' && <span className="mr-2 text-gray-400">$</span>}
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terminal;