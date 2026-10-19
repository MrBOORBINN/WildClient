import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Upload, X, Download, Image as ImageIcon, Zap, AlertCircle, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Attachment } from '../types';
import { auth } from '../firebase';
import { diagnoseImageGenerationEndpoint, editImage, generateImage } from '../services/geminiService';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCredits: number;
  onDeductCredits: (amount: number) => void;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
}

export const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  isOpen,
  onClose,
  userCredits,
  onDeductCredits,
  onImageGenerated
}) => {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'auto' | 'gemini' | 'openai'>('auto');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [sourceImage, setSourceImage] = useState<Attachment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSourceImage({
        name: file.name,
        type: 'image',
        mimeType: file.type || 'image/png',
        data: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description or prompt for the image.');
      return;
    }

    if (userCredits < 10) {
      setError('Insufficient credits. You need 10 credits to generate an image.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
      let data: { imageUrl: string; creditsRemaining?: number; cost?: number };

      if (sourceImage && sourceImage.data) {
        data = await editImage({
          prompt,
          image: sourceImage,
          idToken
        });
      } else {
        data = await generateImage({
          prompt,
          provider,
          aspectRatio,
          idToken
        });
      }

      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        onDeductCredits(10);
      } else {
        throw new Error('No image URL returned from server.');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToChat = () => {
    if (generatedImageUrl) {
      onImageGenerated(generatedImageUrl, prompt);
      onClose();
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `infbott_ai_image_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1e1f20] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#131314]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">AI Image Studio & Editor</h3>
              <p className="text-xs text-[#8e918f]">Generate stunning images or edit photos with real AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-[#8e918f] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Credit Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5">
              <Zap size={18} className="text-amber-400 animate-pulse" />
              <div>
                <p className="text-xs font-medium text-white">Credit Balance</p>
                <p className="text-sm font-bold text-amber-400">{userCredits} Credits Available</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                Cost: 10 credits / generation
              </span>
            </div>
          </div>

          {userCredits < 10 && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>Insufficient credits. You need 10 credits to generate an image.</span>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#c4c7c5] uppercase tracking-wider">
              {sourceImage ? 'Editing Instructions / Prompt' : 'Image Prompt'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={sourceImage ? "Describe the edits you want to make to the uploaded photo..." : "A futuristic neon cyber city at sunset, highly detailed photorealistic 4K..."}
              rows={3}
              className="w-full bg-[#131314] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-[#8e918f] focus:outline-none focus:border-pink-500 transition-colors resize-none"
            />
          </div>

          {/* Source Image Upload (For Editing) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#c4c7c5] uppercase tracking-wider">
              Source Photo (Optional — for Image Editing)
            </label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            {sourceImage ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#131314] border border-white/10">
                <div className="flex items-center gap-3">
                  <img src={sourceImage.data ? sourceImage.data : undefined} alt="Source" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                  <div>
                    <p className="text-xs font-medium text-white truncate max-w-[200px]">{sourceImage.name}</p>
                    <p className="text-[10px] text-pink-400">Ready for AI photo editing</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSourceImage(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e918f] hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 hover:border-pink-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-[#8e918f] hover:text-white transition-colors bg-[#131314]/50"
              >
                <Upload size={20} className="text-pink-400" />
                <span className="text-xs font-medium">Upload photo to edit (optional)</span>
              </button>
            )}
          </div>

          {/* Provider & Aspect Ratio Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#c4c7c5] uppercase tracking-wider">AI Provider</label>
              <select
                value={provider}
                onChange={(e: any) => setProvider(e.target.value)}
                className="w-full bg-[#131314] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="auto">Auto Select (Gemini & OpenAI)</option>
                <option value="gemini">Google Gemini Imagen</option>
                <option value="openai">OpenAI DALL-E 3</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#c4c7c5] uppercase tracking-wider">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-[#131314] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="1:1">1:1 Square (Default)</option>
                <option value="16:9">16:9 Landscape / Banner</option>
                <option value="9:16">9:16 Portrait / Mobile</option>
                <option value="4:3">4:3 Standard</option>
                <option value="3:4">3:4 Vertical</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedImageUrl && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} /> Image Generated Successfully (-10 credits)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                  <button
                    onClick={handleAddToChat}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition-colors shadow-lg"
                  >
                    <Sparkles size={14} /> Insert into Chat
                  </button>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center p-2">
                <img src={generatedImageUrl ? generatedImageUrl : undefined} alt="Generated AI Output" className="max-h-80 object-contain rounded-lg" referrerPolicy="no-referrer" />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#131314]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#8e918f] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || userCredits < 10 || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:scale-105"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Image (Cost: 10 credits)...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Image (10 Credits)</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
