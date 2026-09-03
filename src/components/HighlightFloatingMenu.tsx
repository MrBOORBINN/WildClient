import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Highlighter, Check, Tag as TagIcon, Plus, X } from 'lucide-react';
import { SnippetColor } from '../types';

interface HighlightFloatingMenuProps {
  position: { x: number; y: number } | null;
  selectedText: string;
  onSave: (text: string, color: SnippetColor, tag?: string, note?: string) => void;
  onClose: () => void;
}

const COLORS: { key: SnippetColor; label: string; dot: string; ring: string }[] = [
  { key: 'amber', label: 'Amber', dot: 'bg-amber-400', ring: 'ring-amber-400' },
  { key: 'emerald', label: 'Emerald', dot: 'bg-emerald-400', ring: 'ring-emerald-400' },
  { key: 'sky', label: 'Sky', dot: 'bg-sky-400', ring: 'ring-sky-400' },
  { key: 'purple', label: 'Purple', dot: 'bg-purple-400', ring: 'ring-purple-400' },
  { key: 'rose', label: 'Rose', dot: 'bg-rose-400', ring: 'ring-rose-400' }
];

export const HighlightFloatingMenu: React.FC<HighlightFloatingMenuProps> = ({
  position,
  selectedText,
  onSave,
  onClose
}) => {
  const [selectedColor, setSelectedColor] = useState<SnippetColor>('amber');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [tag, setTag] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleGlobalMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleGlobalMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!position || !selectedText.trim()) return null;

  const handleSaveSnippet = () => {
    onSave(selectedText, selectedColor, tag.trim() || undefined, note.trim() || undefined);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div 
        ref={containerRef}
        className="fixed z-50 pointer-events-auto"
        style={{
          left: `${Math.max(16, Math.min(window.innerWidth - 300, position.x))}px`,
          top: `${Math.max(16, position.y)}px`,
          transform: 'translate(-50%, -100%) translateY(-10px)'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 6 }}
          className="bg-[#1e1e1e]/95 backdrop-blur-md border border-amber-500/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] p-2 text-white flex flex-col gap-2 min-w-[260px]"
        >
          {savedSuccess ? (
            <div className="flex items-center justify-center gap-2 py-2 px-3 text-emerald-400 text-xs font-semibold">
              <Check size={16} />
              <span>Saved to Personal Notebook!</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveSnippet}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                  title="Save selected text to personal notebook"
                >
                  <Highlighter size={13} className="text-black" />
                  <span>Save Highlight</span>
                </button>

                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                  {COLORS.map((c) => (
                    <button
                      key={`float-color-${c.key}`}
                      type="button"
                      onClick={() => setSelectedColor(c.key)}
                      className={`w-4 h-4 rounded-full ${c.dot} transition-transform cursor-pointer ${
                        selectedColor === c.key ? `ring-2 ring-white scale-115` : 'opacity-60 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    showNoteInput || note || tag ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-[#8e918f] hover:text-white'
                  }`}
                  title="Add tag or note"
                >
                  <TagIcon size={13} />
                </button>
              </div>

              {showNoteInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-1.5 border-t border-white/10 space-y-2 text-xs"
                >
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Add tag (e.g. Key Point, Code, Question)"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-[#8e918f] focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Personal note / takeaway (optional)..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-[#8e918f] focus:outline-none focus:border-amber-400"
                  />
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
