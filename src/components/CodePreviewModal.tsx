import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, RotateCcw, Maximize2, Minimize2, Code, MonitorPlay, Sparkles } from 'lucide-react';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language?: string;
  title?: string;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language = 'html',
  title = 'Game & Code Sandbox Preview'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate safe HTML sandbox bundle
  const generateSandboxHtml = (sourceCode: string, lang: string) => {
    const isFullHtml = sourceCode.includes('<!DOCTYPE') || sourceCode.includes('<html');

    if (isFullHtml) {
      return sourceCode;
    }

    if (lang === 'javascript' || lang === 'js') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 16px;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #canvas {
      display: block;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <canvas id="canvas" width="600" height="400"></canvas>
  <script>
    try {
      ${sourceCode}
    } catch(err) {
      document.body.innerHTML += '<div style="color:#ef4444; margin-top:12px; font-family:monospace;"><b>Runtime Error:</b> ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
    }

    // Default HTML/CSS/JS snippet wrapper
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background: #111827;
      color: #f3f4f6;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  ${sourceCode}
</body>
</html>`;
  };

  const sandboxHtml = generateSandboxHtml(code, language);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white transition-all ${
              isFullscreen ? 'fixed inset-3' : 'w-full max-w-5xl h-[85vh]'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <MonitorPlay size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-white">{title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      Live Sandbox
                    </span>
                  </div>
                  <p className="text-xs text-[#8e918f]">Interactive game & code execution environment</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#c4c7c5] hover:text-white transition-colors"
                  title="Restart game / re-run code"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Restart</span>
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors ml-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Sandbox Iframe */}
            <div className="flex-1 bg-[#09090b] relative overflow-hidden">
              <iframe
                key={refreshKey}
                ref={iframeRef}
                title="Code Runner Sandbox"
                srcDoc={sandboxHtml}
                sandbox="allow-scripts allow-modals allow-pointer-lock allow-same-origin"
                className="w-full h-full border-none"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
