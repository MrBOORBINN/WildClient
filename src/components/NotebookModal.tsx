import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Highlighter, 
  Tag as TagIcon, 
  Edit3, 
  Download, 
  BookOpen, 
  Sparkles,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { NotebookSnippet, SnippetColor } from '../types';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippets: NotebookSnippet[];
  onDeleteSnippet: (id: string) => Promise<void> | void;
  onUpdateSnippet: (id: string, updates: Partial<NotebookSnippet>) => Promise<void> | void;
  onSelectSession?: (sessionId: string) => void;
  onSendToChat?: (snippetText: string) => void;
}

const COLOR_MAP: Record<SnippetColor, { bg: string; border: string; text: string; dot: string; glow: string }> = {
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    glow: 'rgba(245, 158, 11, 0.15)'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  sky: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
    glow: 'rgba(14, 165, 233, 0.15)'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
    glow: 'rgba(168, 85, 247, 0.15)'
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    glow: 'rgba(244, 63, 94, 0.15)'
  },
};

export const NotebookModal: React.FC<NotebookModalProps> = ({
  isOpen,
  onClose,
  snippets,
  onDeleteSnippet,
  onUpdateSnippet,
  onSelectSession,
  onSendToChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editTagText, setEditTagText] = useState('');
  const [editColor, setEditColor] = useState<SnippetColor>('amber');

  // Extract all distinct tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    snippets.forEach(s => {
      if (s.tag && s.tag.trim()) {
        tags.add(s.tag.trim());
      }
    });
    return Array.from(tags);
  }, [snippets]);

  // Filtered snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter(s => {
      const matchesSearch = 
        !searchQuery.trim() || 
        s.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.note && s.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.tag && s.tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.sessionTitle && s.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesColor = selectedColor === 'all' || s.color === selectedColor;
      const matchesTag = selectedTag === 'all' || s.tag === selectedTag;

      return matchesSearch && matchesColor && matchesTag;
    });
  }, [snippets, searchQuery, selectedColor, selectedTag]);

  const handleCopySnippet = (id: string, text: string, note?: string) => {
    const fullText = note ? `"${text}"\n\nNote: ${note}` : text;
    navigator.clipboard.writeText(fullText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportAll = () => {
    if (snippets.length === 0) return;
    const content = snippets.map((s, idx) => {
      const date = new Date(s.createdAt).toLocaleString();
      let md = `### Highlight ${idx + 1} (${date})\n\n> ${s.text}\n\n`;
      if (s.note) md += `**Note**: ${s.note}\n\n`;
      if (s.tag) md += `**Tag**: #${s.tag}\n\n`;
      if (s.sessionTitle) md += `*Source Session*: ${s.sessionTitle}\n\n`;
      return md + `---\n`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-notebook-snippets-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    if (snippets.length === 0) return;
    const content = snippets.map((s, idx) => {
      const date = new Date(s.createdAt).toLocaleString();
      let txt = `[${idx + 1}] "${s.text}" (${date})\n`;
      if (s.note) txt += `Note: ${s.note}\n`;
      if (s.tag) txt += `Tag: #${s.tag}\n`;
      return txt;
    }).join('\n---\n\n');

    navigator.clipboard.writeText(content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const startEditing = (snippet: NotebookSnippet) => {
    setEditingId(snippet.id);
    setEditNoteText(snippet.note || '');
    setEditTagText(snippet.tag || '');
    setEditColor(snippet.color || 'amber');
  };

  const saveEditing = async (snippetId: string) => {
    await onUpdateSnippet(snippetId, {
      note: editNoteText.trim() || undefined,
      tag: editTagText.trim() || undefined,
      color: editColor
    });
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#e3e3e3]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
                <Highlighter size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-white">Personal Notebook</h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/10 text-[#c4c7c5]">
                    {snippets.length} {snippets.length === 1 ? 'snippet' : 'snippets'}
                  </span>
                </div>
                <p className="text-xs text-[#8e918f] hidden sm:block">
                  Saved snippets and highlights from AI conversations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {snippets.length > 0 && (
                <>
                  <button
                    onClick={handleCopyAll}
                    title="Copy all snippets"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#c4c7c5] hover:text-white transition-colors"
                  >
                    {copiedAll ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copiedAll ? 'Copied' : 'Copy All'}</span>
                  </button>
                  <button
                    onClick={handleExportAll}
                    title="Export as Markdown"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#c4c7c5] hover:text-white transition-colors"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors ml-1"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-white/5 bg-white/[0.01] space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e918f]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search highlights, notes, or tags..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-[#8e918f] focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e918f] hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Color filter */}
              <div className="flex items-center gap-1.5 self-start sm:self-center overflow-x-auto py-1">
                <span className="text-[11px] text-[#8e918f] mr-1 hidden sm:inline">Color:</span>
                <button
                  onClick={() => setSelectedColor('all')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedColor === 'all' ? 'bg-white/15 text-white' : 'text-[#8e918f] hover:text-white'
                  }`}
                >
                  All
                </button>
                {(['amber', 'emerald', 'sky', 'purple', 'rose'] as SnippetColor[]).map((c) => (
                  <button
                    key={`color-filter-${c}`}
                    onClick={() => setSelectedColor(selectedColor === c ? 'all' : c)}
                    className={`w-5 h-5 rounded-full ${COLOR_MAP[c].dot} transition-transform ${
                      selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={`Filter by ${c}`}
                  />
                ))}
              </div>
            </div>

            {/* Tag Pills */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
                <span className="text-[11px] text-[#8e918f] shrink-0">Tags:</span>
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                    selectedTag === 'all' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-[#8e918f] hover:text-white'
                  }`}
                >
                  All ({snippets.length})
                </button>
                {allTags.map(tag => (
                  <button
                    key={`tag-pill-${tag}`}
                    onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 transition-colors flex items-center gap-1 ${
                      selectedTag === tag ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-[#8e918f] hover:text-white'
                    }`}
                  >
                    <TagIcon size={10} />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Snippets List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {filteredSnippets.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#8e918f]">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {snippets.length === 0 ? 'Your notebook is empty' : 'No matching highlights'}
                </h3>
                <p className="text-xs max-w-sm leading-relaxed text-[#8e918f]">
                  {snippets.length === 0 
                    ? 'Select any text snippet in an AI response to highlight and save it directly to your personal notebook.'
                    : 'Try adjusting your search query or filters to find what you are looking for.'}
                </p>
                {snippets.length === 0 && (
                  <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
                    <Sparkles size={13} />
                    <span>Tip: Highlight text in chat → click "✨ Save to Notebook"</span>
                  </div>
                )}
              </div>
            ) : (
              filteredSnippets.map((snippet) => {
                const colorStyle = COLOR_MAP[snippet.color || 'amber'];
                const isEditing = editingId === snippet.id;
                const formattedDate = new Date(snippet.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <motion.div
                    key={`snippet-card-${snippet.id}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group relative rounded-xl border ${colorStyle.border} ${colorStyle.bg} p-4 sm:p-5 transition-all shadow-sm hover:shadow-md`}
                  >
                    {/* Top Row: Tag & Date & Actions */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorStyle.dot}`} />
                        {snippet.tag && (
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-medium text-white/90 flex items-center gap-1">
                            <TagIcon size={10} />
                            {snippet.tag}
                          </span>
                        )}
                        {snippet.sessionTitle && (
                          <span className="text-[11px] text-[#8e918f] truncate max-w-[180px] sm:max-w-xs flex items-center gap-1">
                            <MessageSquare size={11} />
                            {snippet.sessionTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                        <span className="text-[10px] text-[#8e918f] hidden sm:inline mr-1">
                          {formattedDate}
                        </span>

                        {onSendToChat && (
                          <button
                            onClick={() => onSendToChat(snippet.text)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[#8e918f] hover:text-amber-300 transition-colors"
                            title="Send note to chat"
                          >
                            <MessageSquare size={13} />
                          </button>
                        )}

                        <button
                          onClick={() => handleCopySnippet(snippet.id, snippet.text, snippet.note)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#8e918f] hover:text-white transition-colors"
                          title="Copy snippet"
                        >
                          {copiedId === snippet.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>

                        <button
                          onClick={() => isEditing ? setEditingId(null) : startEditing(snippet)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#8e918f] hover:text-white transition-colors"
                          title="Edit note & tag"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          onClick={() => onDeleteSnippet(snippet.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-[#8e918f] hover:text-rose-400 transition-colors"
                          title="Delete snippet"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Highlighted Quote Text */}
                    <div className="relative pl-3 border-l-2 border-white/20 my-2">
                      <p className="text-xs sm:text-sm text-white/95 leading-relaxed whitespace-pre-wrap font-sans">
                        "{snippet.text}"
                      </p>
                    </div>

                    {/* User Annotation / Note */}
                    {!isEditing && snippet.note && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-start gap-2">
                        <span className="text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider shrink-0 mt-0.5">Note:</span>
                        <p className="text-xs text-[#c4c7c5] leading-relaxed italic">
                          {snippet.note}
                        </p>
                      </div>
                    )}

                    {/* Inline Editor */}
                    {isEditing && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-white/10 space-y-3"
                      >
                        <div>
                          <label className="block text-[11px] text-[#8e918f] mb-1">Personal Note:</label>
                          <textarea
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            placeholder="Add your reflections, takeaways, or action items..."
                            className="w-full bg-black/40 border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder:text-[#8e918f] focus:outline-none focus:border-amber-400 resize-none h-20"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-[#8e918f]">Tag:</label>
                            <input
                              type="text"
                              value={editTagText}
                              onChange={(e) => setEditTagText(e.target.value)}
                              placeholder="e.g. Important, Code, Idea"
                              className="bg-black/40 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-[#8e918f] focus:outline-none focus:border-amber-400 w-36"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#8e918f]">Color:</span>
                            <div className="flex items-center gap-1">
                              {(['amber', 'emerald', 'sky', 'purple', 'rose'] as SnippetColor[]).map((c) => (
                                <button
                                  key={`edit-color-${c}`}
                                  type="button"
                                  onClick={() => setEditColor(c)}
                                  className={`w-4 h-4 rounded-full ${COLOR_MAP[c].dot} transition-transform ${
                                    editColor === c ? 'ring-2 ring-white scale-125' : 'opacity-60'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#c4c7c5]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditing(snippet.id)}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors"
                          >
                            Save Note
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Bottom Session Link */}
                    {onSelectSession && snippet.sessionId && (
                      <div className="mt-2.5 flex justify-end">
                        <button
                          onClick={() => {
                            onSelectSession(snippet.sessionId!);
                            onClose();
                          }}
                          className="text-[11px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 transition-colors"
                        >
                          <span>Open in chat session</span>
                          <ExternalLink size={10} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
