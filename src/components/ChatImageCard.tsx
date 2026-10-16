import React, { useState, useRef } from 'react';
import { Sliders, Download, Check, X, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export type ImageFilterType = 'original' | 'grayscale' | 'sepia' | 'contrast';

interface ChatImageCardProps {
  src: string;
  alt?: string;
}

export const ChatImageCard: React.FC<ChatImageCardProps> = ({ src, alt = "INFBOTT Image" }) => {
  const [selectedFilter, setSelectedFilter] = useState<ImageFilterType>('original');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // CSS filter strings strictly per user specifications
  const filterStyles: Record<ImageFilterType, string> = {
    original: 'none',
    grayscale: 'grayscale(1)',
    sepia: 'sepia(1)',
    contrast: 'contrast(1.8)'
  };

  // Canvas filter strings for applying directly to exported file
  const filterCanvasValues: Record<ImageFilterType, string> = {
    original: 'none',
    grayscale: 'grayscale(100%)',
    sepia: 'sepia(100%)',
    contrast: 'contrast(180%)'
  };

  const filterOptions: { id: ImageFilterType; label: string }[] = [
    { id: 'original', label: 'Original' },
    { id: 'grayscale', label: 'Grayscale' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'contrast', label: 'High Contrast' }
  ];

  // Download image with selected filter baked into the exported PNG via HTML5 Canvas
  const handleDownload = () => {
    setIsDownloading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 1024;
        canvas.height = img.naturalHeight || img.height || 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          triggerDirectDownload();
          return;
        }

        ctx.filter = filterCanvasValues[selectedFilter];
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const filteredDataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = filteredDataUrl;
        link.download = `infbott_${selectedFilter === 'original' ? 'image' : selectedFilter}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.warn('Canvas export failed, falling back to direct download:', err);
        triggerDirectDownload();
      } finally {
        setIsDownloading(false);
      }
    };

    img.onerror = () => {
      triggerDirectDownload();
      setIsDownloading(false);
    };

    img.src = src;
  };

  const triggerDirectDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = 'infbott_image.png';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl max-w-[440px] w-full transition-all">
      {/* Image Preview Container */}
      <div className="relative group overflow-hidden bg-black flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          style={{ filter: filterStyles[selectedFilter] }}
          className="w-full h-auto object-cover rounded-2xl transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => setIsFullscreen(true)}
          loading="lazy"
        />

        {/* Top-Right Quick Action Controls */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all shadow-lg border",
              isMenuOpen || selectedFilter !== 'original'
                ? "bg-purple-600/90 text-white border-purple-400/50 shadow-purple-500/20"
                : "bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border-white/20"
            )}
            title="Image Filters & Quick Actions"
          >
            <Sliders size={13} className={cn(selectedFilter !== 'original' && "text-pink-300 animate-pulse")} />
            <span className="hidden sm:inline">Filters</span>
            {selectedFilter !== 'original' && (
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            )}
          </button>

          {/* Fullscreen Zoom */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all shadow-lg"
            title="View Full Size"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Filters Popup Menu */}
        {isMenuOpen && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute top-12 right-2.5 z-30 w-52 p-2.5 rounded-2xl bg-[#121316]/95 border border-white/15 backdrop-blur-xl shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 px-1">
              <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                Photo Filters
              </span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="text-white/50 hover:text-white p-0.5"
              >
                <X size={12} />
              </button>
            </div>

            {/* Filter Options */}
            <div className="space-y-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedFilter(opt.id)}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left",
                    selectedFilter === opt.id
                      ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span>{opt.label}</span>
                  {selectedFilter === opt.id && (
                    <Check size={13} className="text-purple-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Reset option if filtered */}
            {selectedFilter !== 'original' && (
              <div className="pt-1 border-t border-white/10">
                <button
                  onClick={() => setSelectedFilter('original')}
                  className="w-full text-center text-[11px] text-pink-400 hover:text-pink-300 py-1 transition-colors"
                >
                  Reset to Original
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Metadata & Download Bar */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/90 font-medium truncate max-w-[180px] sm:max-w-[240px]">
              {alt}
            </span>
            {selectedFilter !== 'original' && (
              <span className="text-[10px] font-mono uppercase bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                {selectedFilter}
              </span>
            )}
          </div>

          {/* Download Button (Exports with filter applied) */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md text-white text-xs font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Download image with active filter applied"
          >
            <Download size={13} />
            <span>{isDownloading ? "Saving…" : "Download"}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div 
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X size={20} />
            </button>
            <img
              src={src}
              alt={alt}
              style={{ filter: filterStyles[selectedFilter] }}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                <Download size={14} />
                <span>Download Image ({selectedFilter})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
