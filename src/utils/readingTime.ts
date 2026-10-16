/**
 * Calculates estimated reading time for assistant responses.
 * Uses standard average silent reading speed of ~200 - 250 words per minute.
 */
export function calculateReadingTime(text: string): { 
  formatted: string; 
  words: number; 
  seconds: number;
} {
  if (!text || text.trim().length === 0) {
    return { formatted: '< 1 min read', words: 0, seconds: 0 };
  }

  // Strip markdown code blocks, links, and markdown syntax to evaluate readable text
  const clean = text
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]*`/g, '')        // inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // link labels
    .replace(/[#*_~\[\]()\-!>]/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter(w => w.length > 0).length;
  // Standard adult reading speed: ~200 words per minute (~3.33 words/sec)
  const totalSeconds = Math.max(1, Math.round(words / 3.33));

  let formatted = '';
  if (words < 30) {
    formatted = '< 1 min read';
  } else if (totalSeconds < 60) {
    formatted = `${totalSeconds}s read`;
  } else {
    const minutes = Math.ceil(words / 200);
    formatted = `${minutes} min read`;
  }

  return { formatted, words, seconds: totalSeconds };
}
