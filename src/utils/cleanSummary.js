/**
 * Clean a stored summary for display — strip leftover markdown artifacts.
 */
export function cleanSummary(text) {
  if (!text) return '';
  return text
    .replace(/<img[^>]*>/g, '')            // HTML images
    .replace(/<[^>]+>/g, '')               // other HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, '')       // markdown images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')    // markdown links → just text
    .replace(/\$\$[^$]*\$\$/g, '')         // block LaTeX
    .replace(/\$[^$]+\$/g, '')             // inline LaTeX
    .replace(/\\[a-zA-Z]+/g, '')           // LaTeX commands like \sum
    .replace(/\{[^}]*\}/g, '')             // LaTeX braces
    .replace(/[🟢🟡🔴📚📄📖🗺️✅❌💡⚡🔥🎯]\s*/g, '') // emoji
    .replace(/^>\s*/gm, '')                // blockquote markers
    .replace(/^[-*+]\s+/gm, '')            // list markers
    .replace(/^\d+\.\s+/gm, '')            // numbered list markers
    .replace(/\*\*(.*?)\*\*/g, '$1')       // bold
    .replace(/\*(.*?)\*/g, '$1')           // italic
    .replace(/`(.*?)`/g, '$1')             // inline code
    .replace(/#+\s*/g, '')                 // heading markers
    .replace(/\s+/g, ' ')                  // collapse whitespace
    .trim();
}
