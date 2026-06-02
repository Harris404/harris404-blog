// Markdown normalizer — run on every article write (create/update) so two
// recurring authoring pitfalls can never break KaTeX rendering again:
//
//   1) A closing block-HTML tag glued to a display-math block, e.g.
//      `</div>$$...$$`. Markdown treats the HTML as a block that only ends at
//      a blank line, so the glued `$$` gets swallowed as raw HTML and never
//      renders. Fix: guarantee a blank line between `</tag>` and `$$`.
//
//   2) A multi-line `$$ ... $$` display block. remark-math mis-pairs the
//      delimiters across line breaks ("Can't use function '$'"). Newlines are
//      insignificant inside LaTeX, so we collapse them to single spaces.
//
// Both transforms are idempotent (safe to run repeatedly) and never touch the
// inside of fenced code blocks.

// Private-use-area sentinels: can't collide with real content and aren't
// affected by the whitespace / `$$` transforms below.
const OPEN = String.fromCharCode(0xE000);
const CLOSE = String.fromCharCode(0xE001);

export function normalizeMarkdown(input) {
  if (typeof input !== 'string' || !input) return input;

  // 1. Stash fenced code blocks so we never rewrite their contents.
  const fences = [];
  let s = input.replace(/```[\s\S]*?```/g, (m) => {
    fences.push(m);
    return `${OPEN}${fences.length - 1}${CLOSE}`;
  });

  // 2. Ensure a blank line between a closing HTML tag and a following `$$`.
  //    Matches `</tag>$$` or `</tag>\n$$` (no blank line) — but NOT when a
  //    blank line already exists, so it's idempotent.
  s = s.replace(/(<\/[a-zA-Z][^>]*>)[ \t]*\n?[ \t]*(\$\$)/g, '$1\n\n$2');

  // 3. Collapse internal newlines inside every `$$ ... $$` display block.
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) =>
    '$$' + inner.replace(/\s*\n\s*/g, ' ') + '$$'
  );

  // 4. Restore fenced code blocks.
  s = s.replace(new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g'), (_, i) => fences[Number(i)]);

  return s;
}
