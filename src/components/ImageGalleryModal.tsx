import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, RotateCw, Image as ImageIcon, Copy, Check, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface GalleryImage {
  id: string;
  url: string;
  prompt?: string;
  timestamp?: number;
  isEdit?: boolean;
}

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  onRegenerate?: (prompt: string) => void;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  isOpen,
  onClose,
  images,
  onRegenerate
}) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = (url: string, name: string = 'infbott_image.png') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = (promptText: string, id: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#16171a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1e1f20]/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ImageIcon size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Chat Image Gallery</h2>
                <p className="text-xs text-[#8e918f]">
                  {images.length} {images.length === 1 ? 'image' : 'images'} generated or edited in this session
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content: Grid of Images */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                  <ImageIcon size={28} />
                </div>
                <p className="text-sm font-semibold text-white/80">No images created yet in this session</p>
                <p className="text-xs text-[#8e918f] max-w-sm">
                  Generate or edit an image in chat to build up your session collection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-white/25 transition-all shadow-lg flex flex-col justify-between"
                  >
                    {/* Image Preview Container */}
                    <div 
                      onClick={() => setSelectedImage(img)}
                      className="relative aspect-square overflow-hidden cursor-pointer bg-[#0f1013]"
                    >
                      <img
                        src={img.url}
                        alt={img.prompt || "INFBOTT AI Image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="p-2 rounded-xl bg-black/60 text-white backdrop-blur-md border border-white/20">
                          <Maximize2 size={16} />
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Actions Card */}
                    <div className="p-3 bg-[#1e1f20]/90 space-y-2 border-t border-white/5">
                      {img.prompt && (
                        <p className="text-xs text-white/90 line-clamp-2 italic" title={img.prompt}>
                          "{img.prompt}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          {img.isEdit && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                              Edit
                            </span>
                          )}
                          {img.timestamp && (
                            <span className="text-[10px] text-white/40 font-mono">
                              {new Date(img.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {img.prompt && (
                            <button
                              onClick={() => handleCopyPrompt(img.prompt!, img.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                              title="Copy prompt"
                            >
                              {copiedPromptId === img.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>
                          )}

                          {onRegenerate && img.prompt && (
                            <button
                              onClick={() => {
                                onRegenerate(img.prompt!);
                                onClose();
                              }}
                              className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-300 transition-colors cursor-pointer"
                              title="Regenerate using this prompt"
                            >
                              <RotateCw size={13} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDownload(img.url, `infbott_${img.id}.png`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                            title="Download high-resolution image"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Full-size Single Image Lightbox */}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white cursor-pointer"
              >
                <X size={22} />
              </button>

              <img
                src={selectedImage.url}
                alt={selectedImage.prompt || "INFBOTT AI Image"}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              {selectedImage.prompt && (
                <p className="mt-3 text-xs text-white/80 max-w-lg text-center italic bg-black/60 px-4 py-2 rounded-xl border border-white/10">
                  "{selectedImage.prompt}"
                </p>
              )}

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => handleDownload(selectedImage.url, `infbott_${selectedImage.id}.png`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Original</span>
                </button>

                {onRegenerate && selectedImage.prompt && (
                  <button
                    onClick={() => {
                      onRegenerate(selectedImage.prompt!);
                      setSelectedImage(null);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCw size={14} />
                    <span>Regenerate Image</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
export default ImageGalleryModal;
