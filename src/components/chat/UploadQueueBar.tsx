import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Code, 
  File, 
  X, 
  RotateCcw, 
  Pause, 
  Play, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { UploadItem } from '../../types';

interface UploadQueueBarProps {
  items: UploadItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onTogglePause?: (id: string) => void;
}

export const UploadQueueBar: React.FC<UploadQueueBarProps> = ({
  items,
  onCancel,
  onRetry,
  onTogglePause
}) => {
  if (items.length === 0) return null;

  const getFileIcon = (type: UploadItem['type']) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'video': return Video;
      case 'audio': return Music;
      case 'code': return Code;
      case 'pdf':
      case 'document': return FileText;
      default: return File;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="px-4 py-2 bg-[#111111] border-t border-[#414141] flex flex-wrap gap-2 z-20">
      {items.map((item) => {
        const Icon = getFileIcon(item.type);
        const isDone = item.status === 'completed';
        const isError = item.status === 'error';
        const isPaused = item.status === 'paused';

        return (
          <div 
            key={item.id}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#2C2C2C] border border-[#414141] text-xs text-white max-w-xs shadow-md animate-in fade-in"
          >
            {item.previewUrl ? (
              <img src={item.previewUrl} alt={item.name} className="w-6 h-6 rounded-md object-cover shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-md bg-[#1A1A1A] flex items-center justify-center text-[#9b72cb] shrink-0">
                <Icon size={13} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-white truncate max-w-[130px]">{item.name}</div>
              <div className="flex items-center gap-1.5 text-[9px] text-[#A0A0A0]">
                <span>{formatSize(item.size)}</span>
                <span>·</span>
                {isDone ? (
                  <span className="text-[#34a853] flex items-center gap-0.5">
                    <CheckCircle2 size={10} /> Ready
                  </span>
                ) : isError ? (
                  <span className="text-red-400 flex items-center gap-0.5">
                    <AlertCircle size={10} /> Failed
                  </span>
                ) : isPaused ? (
                  <span className="text-amber-400">Paused</span>
                ) : (
                  <span className="text-[#9b72cb] font-mono">{Math.round(item.progress)}%</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {isError && (
                <button 
                  onClick={() => onRetry(item.id)}
                  className="p-1 hover:bg-[#383838] text-white rounded transition-colors"
                  title="Retry upload"
                >
                  <RotateCcw size={12} />
                </button>
              )}
              {!isDone && !isError && onTogglePause && (
                <button 
                  onClick={() => onTogglePause(item.id)}
                  className="p-1 hover:bg-[#383838] text-[#A0A0A0] hover:text-white rounded transition-colors"
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? <Play size={12} /> : <Pause size={12} />}
                </button>
              )}
              <button 
                onClick={() => onCancel(item.id)}
                className="p-1 hover:bg-[#383838] text-[#A0A0A0] hover:text-white rounded transition-colors"
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
