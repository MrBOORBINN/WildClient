import React, { useState } from 'react';
import { Sliders, Download, Check, X, Maximize2, AlertCircle, RefreshCw, RotateCw, Images, Stamp } from 'lucide-react';
import { cn } from '../lib/utils';

export type ImageFilterType = 'original' | 'grayscale' | 'sepia' | 'contrast';

interface ChatImageCardProps {
  src: string;
  alt?: string;
  prompt?: string;
  onRegenerate?: (prompt: string) => void;
  onOpenGallery?: () => void;
  onUseAsWatermark?: (src: string) => void;
}

export const ChatImageCard: React.FC<ChatImageCardProps> = ({ 
  src, 
  alt = "INFBOTT AI Image",
  prompt,
  onRegenerate,
  onOpenGallery,
  onUseAsWatermark
}) => {
  const [selectedFilter, setSelectedFilter] = useState<ImageFilterType>('original');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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
        const width = img.naturalWidth || img.width || 1024;
        const height = img.naturalHeight || img.height || 1024;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          triggerDirectDownload();
          return;
        }

        // Draw original full-resolution image
        ctx.drawImage(img, 0, 0, width, height);

        // Apply selected filter to canvas pixel data
        if (selectedFilter !== 'original') {
          try {
            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;

            if (selectedFilter === 'grayscale') {
              for (let i = 0; i < data.length; i += 4) {
                const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
              }
            } else if (selectedFilter === 'sepia') {
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, Math.round(0.393 * r + 0.769 * g + 0.189 * b));
                data[i + 1] = Math.min(255, Math.round(0.349 * r + 0.686 * g + 0.168 * b));
                data[i + 2] = Math.min(255, Math.round(0.272 * r + 0.534 * g + 0.131 * b));
              }
            } else if (selectedFilter === 'contrast') {
              const factor = 1.8;
              for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, Math.round(factor * (data[i] - 128) + 128)));
                data[i + 1] = Math.min(255, Math.max(0, Math.round(factor * (data[i + 1] - 128) + 128)));
                data[i + 2] = Math.min(255, Math.max(0, Math.round(factor * (data[i + 2] - 128) + 128)));
              }
            }

            ctx.putImageData(imgData, 0, 0);
          } catch (pixelErr) {
            console.warn('Pixel manipulation restricted, using ctx.filter fallback:', pixelErr);
            ctx.clearRect(0, 0, width, height);
            ctx.filter = filterCanvasValues[selectedFilter];
            ctx.drawImage(img, 0, 0, width, height);
          }
        }

        const filteredDataUrl = canvas.toDataURL('image/png', 1.0);
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

  if (!src) {
    return null;
  }

  const effectivePrompt = prompt || alt;

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl max-w-[500px] w-full transition-all">
      {/* Image Preview Container */}
      <div className="relative group overflow-hidden bg-[#16171a] min-h-[220px] flex items-center justify-center">
        {/* Loading Indicator */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-2" />
            <span className="text-[11px] text-white/70">Rendering image...</span>
          </div>
        )}

        {/* Failed image state */}
        {hasError ? (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle size={28} className="text-amber-400" />
            <p className="text-xs text-white/80">Image could not be rendered directly.</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={triggerDirectDownload}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={12} />
                <span>Download File</span>
              </button>
            </div>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            style={{ filter: filterStyles[selectedFilter] }}
            className={cn(
              "w-full h-auto max-h-[500px] object-contain rounded-2xl transition-all duration-300 ease-in-out cursor-pointer",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onClick={() => setIsFullscreen(true)}
            title="Click image to open in full original resolution"
            loading="eager"
          />
        )}

        {/* Top-Right Quick Action Controls */}
        {!hasError && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
            {/* Regenerate Button */}
            {onRegenerate && effectivePrompt && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(effectivePrompt);
                }}
                className="p-1.5 rounded-xl bg-black/60 hover:bg-purple-600 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all shadow-lg cursor-pointer"
                title="Regenerate this image using the same original prompt"
                aria-label="Regenerate image"
              >
                <RotateCw size={13} />
              </button>
            )}

            {/* Gallery Button */}
            {onOpenGallery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenGallery();
                }}
                className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all shadow-lg cursor-pointer"
                title="View all session images in Image Gallery"
                aria-label="Open Image Gallery"
              >
                <Images size={13} />
              </button>
            )}

            {/* Use as Watermark Button */}
            {onUseAsWatermark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseAsWatermark(src);
                }}
                className="p-1.5 rounded-xl bg-black/60 hover:bg-purple-600 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all shadow-lg cursor-pointer"
                title="Use this as watermark (creates transparent watermark stamp)"
                aria-label="Use as watermark"
              >
                <Stamp size={13} />
              </button>
            )}

            {/* Filters Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all shadow-lg border cursor-pointer",
                isMenuOpen || selectedFilter !== 'original'
                  ? "bg-purple-600/90 text-white border-purple-400/50 shadow-purple-500/20"
                  : "bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border-white/20"
              )}
              title="Apply artistic photo filters (Grayscale, Sepia, Contrast)"
              aria-label="Photo filters"
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
              className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all shadow-lg cursor-pointer"
              title="Zoom to view full original resolution in lightbox"
              aria-label="Zoom to original resolution"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        )}

        {/* Filters Popup Menu */}
        {isMenuOpen && !hasError && (
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
                className="text-white/50 hover:text-white p-0.5 cursor-pointer"
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
                    "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
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

            {/* Reset & Download Filtered Image Actions */}
            <div className="pt-1.5 border-t border-white/10 space-y-1">
              <button
                type="button"
                onClick={() => setSelectedFilter('original')}
                className="w-full text-center text-[11px] text-zinc-400 hover:text-white py-1 rounded transition-colors cursor-pointer"
              >
                Reset to Original
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleDownload();
                }}
                disabled={isDownloading}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Download size={12} />
                <span>{isDownloading ? "Processing…" : "Download Filtered Image"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Metadata & Dedicated Download Bar */}
        {!hasError && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/90 font-medium truncate max-w-[170px] sm:max-w-[240px]">
                {alt}
              </span>
              {selectedFilter !== 'original' && (
                <span className="text-[10px] font-mono uppercase bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                  {selectedFilter}
                </span>
              )}
            </div>

            {/* Dedicated Download Image Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md text-white text-xs font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
              title="Download image in full resolution with active filter"
              aria-label="Download image"
            >
              <Download size={13} />
              <span>{isDownloading ? "Saving…" : "Download"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal (Zoom to Original Resolution) */}
      {isFullscreen && (
        <div 
          onClick={() => {
            setIsFullscreen(false);
            setZoomLevel(1);
          }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative max-w-5xl max-h-[92vh] flex flex-col items-center w-full">
            <button
              onClick={() => {
                setIsFullscreen(false);
                setZoomLevel(1);
              }}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white cursor-pointer"
              title="Close fullscreen view"
              aria-label="Close fullscreen"
            >
              <X size={22} />
            </button>

            {/* Lightbox Zoomable Image */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="overflow-auto max-w-full max-h-[78vh] flex items-center justify-center rounded-2xl bg-black/60 p-2 border border-white/10"
            >
              <img
                src={src}
                alt={alt}
                style={{ 
                  filter: filterStyles[selectedFilter],
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center'
                }}
                className="max-w-full max-h-[74vh] object-contain rounded-xl shadow-2xl transition-transform duration-200 cursor-zoom-in"
                onClick={() => setZoomLevel(prev => (prev === 1 ? 1.5 : prev === 1.5 ? 2.0 : 1))}
                title="Click image to zoom in / out"
              />
            </div>

            {/* Lightbox Action Controls Bar */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="mt-4 flex flex-wrap items-center justify-center gap-3 bg-[#1e1f20]/90 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl"
            >
              {/* Zoom controls */}
              <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
                <span className="text-[11px] text-white/60 font-medium">Zoom:</span>
                {[1, 1.5, 2].map(z => (
                  <button
                    key={z}
                    onClick={() => setZoomLevel(z)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer",
                      zoomLevel === z ? "bg-white/20 text-white font-bold" : "text-white/60 hover:text-white"
                    )}
                  >
                    {z * 100}%
                  </button>
                ))}
              </div>

              {/* Regenerate */}
              {onRegenerate && effectivePrompt && (
                <button
                  onClick={() => {
                    onRegenerate(effectivePrompt);
                    setIsFullscreen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all cursor-pointer"
                  title="Regenerate this image"
                >
                  <RotateCw size={13} />
                  <span>Regenerate</span>
                </button>
              )}

              {/* Use as Watermark in Lightbox */}
              {onUseAsWatermark && (
                <button
                  onClick={() => {
                    onUseAsWatermark(src);
                    setIsFullscreen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all cursor-pointer"
                  title="Convert this image to a transparent watermark stamp"
                >
                  <Stamp size={13} />
                  <span>Use as Watermark</span>
                </button>
              )}

              {/* Dedicated Download Image in Lightbox */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
                title="Download original high-resolution image"
              >
                <Download size={13} />
                <span>Download Image</span>
              </button>

              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setZoomLevel(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatImageCard;
