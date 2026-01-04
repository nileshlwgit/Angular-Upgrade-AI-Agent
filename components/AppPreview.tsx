
import React from 'react';
import { Globe, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface AppPreviewProps {
  htmlContent: string;
  version: string;
  nodeVersion?: string;
  onVerify?: () => void;
  canVerify?: boolean;
}

const AppPreview: React.FC<AppPreviewProps> = ({ htmlContent, version, nodeVersion = 'Unknown', onVerify, canVerify }) => {
  // Construct a simulated full HTML document
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          /* Reset & Base */
          body { margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; background-color: #f8f9fa; color: #333; }
          
          /* Angular-like default styles simulation */
          h1 { font-size: 2em; margin-bottom: 0.67em; font-weight: bold; }
          h2 { font-size: 1.5em; margin-bottom: 0.75em; font-weight: bold; }
          p { margin-bottom: 1em; line-height: 1.5; }
          
          /* Fallback styles if the app has none */
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          button { cursor: pointer; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; transition: background 0.2s; }
          button:hover { background: #2563eb; }
          
          /* Error Banner Styles (in case agent injects them) */
          .bg-red-100 { background-color: #fee2e2; }
          .border-red-500 { border-color: #ef4444; }
          .text-red-700 { color: #b91c1c; }
        </style>
        
        <!-- Terminal Boot Sequence Style -->
        <style>
           #boot-terminal {
             position: fixed; top: 0; left: 0; width: 100%; height: 100%;
             background: #0f172a; color: #10b981; font-family: monospace;
             padding: 2rem; z-index: 9999; display: flex; flex-direction: column;
             transition: opacity 0.5s ease-out;
           }
        </style>
      </head>
      <body>
        <!-- Fake Boot Sequence -->
        <div id="boot-terminal">
            <div>> Initializing Sandbox Environment...</div>
            <div id="line-1" style="opacity:0; margin-top: 0.5rem">> Cleaning node_modules... OK</div>
            <div id="line-2" style="opacity:0; margin-top: 0.5rem">> Installing dependencies... OK</div>
            <div id="line-3" style="opacity:0; margin-top: 0.5rem">> Building modules... [====================] 100%</div>
            <div id="line-4" style="opacity:0; margin-top: 0.5rem; color: #3b82f6">> ng serve --port 4200</div>
        </div>

        <script>
            setTimeout(() => { document.getElementById('line-1').style.opacity = 1; }, 500);
            setTimeout(() => { document.getElementById('line-2').style.opacity = 1; }, 1200);
            setTimeout(() => { document.getElementById('line-3').style.opacity = 1; }, 2500);
            setTimeout(() => { document.getElementById('line-4').style.opacity = 1; }, 3200);
            setTimeout(() => { 
                const term = document.getElementById('boot-terminal');
                term.style.opacity = 0;
                setTimeout(() => term.remove(), 500);
            }, 3800);
        </script>

        <div id="app-root">
            ${htmlContent}
        </div>
        
        <!-- injected footer for context -->
        <div style="margin-top: 60px; padding: 20px; border-top: 1px dashed #cbd5e1; text-align: center; color: #64748b; font-size: 12px; font-family: monospace;">
           <span>[Sandbox Environment]</span> • 
           <span>Serving on :4200</span> • 
           <span>Angular v${version}</span>
        </div>
      </body>
    </html>
  `;

  const handlePopOut = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(srcDoc);
      newWindow.document.close();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full relative group shadow-sm">
      {/* Browser Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
        <div className="flex gap-1.5 mr-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500 font-mono flex items-center gap-2 border border-gray-200 shadow-inner">
          <Globe size={12} className="text-blue-500" />
          <span>http://localhost:4200</span>
          <span className="ml-auto flex items-center gap-1 text-gray-400 bg-gray-50 px-1.5 rounded border border-gray-100">
            v{version}
          </span>
        </div>
        <button 
            onClick={handlePopOut}
            className="flex items-center gap-1 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 px-3 py-1 rounded text-xs transition-colors border border-gray-200 shadow-sm"
            title="Open in new window"
        >
            <ExternalLink size={12} />
            <span>Open New Window</span>
        </button>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-white relative">
        <iframe 
          srcDoc={srcDoc}
          title="App Preview"
          className="w-full h-full border-none absolute inset-0"
          sandbox="allow-scripts allow-modals"
        />
        
        {/* Verify Overlay Button */}
        {canVerify && (
           <div className="absolute bottom-6 right-6 z-50 animate-bounce-in">
             <button 
                onClick={onVerify}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
             >
                <CheckCircle size={20} />
                Verify Upgrade & Next Step
             </button>
           </div>
        )}

        {/* Status Indicator Overlay */}
        <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur text-gray-600 text-[10px] font-bold px-2 py-1 rounded border border-gray-200 shadow-sm">
                NG SERVE SIMULATOR
            </div>
            {htmlContent.includes('bg-red-100') && (
                 <div className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded border border-red-200 shadow-sm flex items-center gap-1 animate-pulse">
                    <AlertTriangle size={10} />
                    COMPILATION ERRORS
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AppPreview;