// Cloudflare Pages Function — /api/articles/[id]
// GET single article, PUT update, DELETE remove

// ─── Content Similarity Engine ────────────────────────────────

const STOPWORDS = new Set([
  // English
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
  'is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','can','shall','not','no','nor',
  'this','that','these','those','it','its','my','your','his','her','our','their',
  'we','you','they','he','she','i','me','us','them','what','which','who','whom',
  'how','when','where','why','if','then','than','so','as','up','out','about',
  'into','over','after','before','between','through','during','above','below',
  'each','every','all','both','few','more','most','other','some','such','only',
  'very','just','also','now','here','there','well','back','still','even',
  // Common markdown / code terms to ignore
  'import','export','const','let','var','function','return','class','new','true','false',
  'null','undefined','async','await','try','catch','console','log','use','default',
  // Chinese stopwords
  '的','了','在','是','我','有','和','就','不','人','都','一','一个','上','也','很',
  '到','说','要','去','你','会','着','没有','看','好','自己','这',
]);

/**
 * Tokenize text into lowercase words, removing punctuation and stopwords.
 * Handles both English and Chinese (single chars for Chinese).
 */
function tokenize(text) {
  if (!text) return [];
  // Strip markdown formatting
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')     // code blocks
    .replace(/`[^`]+`/g, ' ')             // inline code
    .replace(/!\[.*?\]\(.*?\)/g, ' ')     // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // links → keep text
    .replace(/#{1,6}\s*/g, ' ')           // headings
    .replace(/[*_~>|]/g, ' ')             // formatting chars
    .replace(/https?:\/\/\S+/g, ' ')      // URLs
    .replace(/\d{2,}/g, ' ');             // long numbers

  // Split on non-word boundaries, keeping Chinese characters
  const words = cleaned
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter(w => w.length >= 2 && !STOPWORDS.has(w));

  return words;
}

/**
 * Extract top-N keywords from text using term frequency.
 * Simple but effective TF approach — no need for IDF with small corpus.
 */
function extractKeywords(text, topN = 30) {
  const words = tokenize(text);
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

/**
 * Jaccard similarity coefficient between two sets.
 * Returns value between 0 (no overlap) and 1 (identical).
 */
function jaccard(setA, setB) {
  if (setA.length === 0 && setB.length === 0) return 0;
  const a = new Set(setA);
  const b = new Set(setB);
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Compute content similarity score between two articles.
 * Returns a score between 0 and 1.
 *
 * Weights:
 *   - Tag overlap (Jaccard):        40%
 *   - Title word overlap (Jaccard): 25%
 *   - Content keywords (Jaccard):   25%
 *   - Category match:                5%
 *   - Series match:                   5%
 */
function computeSimilarity(articleA, articleB) {
  // 1. Tag similarity (40%)
  const tagsA = (articleA._tags || []).map(t => t.toLowerCase());
  const tagsB = (articleB._tags || []).map(t => t.toLowerCase());
  const tagScore = jaccard(tagsA, tagsB);

  // 2. Title word similarity (25%)
  const titleWordsA = tokenize(articleA.title);
  const titleWordsB = tokenize(articleB.title);
  const titleScore = jaccard(titleWordsA, titleWordsB);

  // 3. Content keyword similarity (25%)
  const kwA = articleA._keywords || [];
  const kwB = articleB._keywords || [];
  const contentScore = jaccard(kwA, kwB);

  // 4. Category match (5%)
  const categoryScore = articleA.category === articleB.category ? 1 : 0;

  // 5. Series match (5%)
  const seriesScore = (articleA.series_id && articleA.series_id === articleB.series_id) ? 1 : 0;

  return (
    tagScore     * 0.40 +
    titleScore   * 0.25 +
    contentScore * 0.25 +
    categoryScore* 0.05 +
    seriesScore  * 0.05
  );
}

// ─── Tag Normalization ────────────────────────────────────────

const ACRONYMS = new Set([
  'llm', 'bert', 'gpt', 'gan', 'cnn', 'rnn', 'vae', 'dpo', 'ppo', 'rlhf',
  'nlp', 'rag', 'lora', 'clip', 'vit', 'ai', 'ml', 'api', 'ssl', 'tf', 'idf',
]);

const KNOWN_FORMS = {
  'chain-of-thought': 'Chain-of-Thought',
  'in-context learning': 'In-Context Learning',
  'self-supervised learning': 'Self-Supervised Learning',
  'vision-language': 'Vision-Language',
  'fine-tuning': 'Fine-Tuning',
  'pre-training': 'Pre-Training',
  'multi-task': 'Multi-Task',
};

function normalizeTag(tag) {
  const trimmed = tag.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (KNOWN_FORMS[lower]) return KNOWN_FORMS[lower];
  if (ACRONYMS.has(lower)) return trimmed.toUpperCase();
  return lower.replace(/(?:^|\s|-)\S/g, c => c.toUpperCase());
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Map();
  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (normalized && !seen.has(normalized.toLowerCase())) {
      seen.set(normalized.toLowerCase(), normalized);
    }
  }
  return [...seen.values()];
}

// ─── API Handler ──────────────────────────────────────────────

export async function onRequestGet(context) {
  const { env, params } = context;
  const { id } = params;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const article = await env.DB.prepare(
      'SELECT * FROM articles WHERE id = ?'
    ).bind(id).first();

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers,
      });
    }

    article.tags = JSON.parse(article.tags || '[]');
    article.related_ids = JSON.parse(article.related_ids || '[]');

    // If article is part of a series, fetch all articles in the same series
    if (article.series_id) {
      const { results: seriesResults } = await env.DB.prepare(
        'SELECT id, title, series_order FROM articles WHERE series_id = ? ORDER BY series_order ASC'
      ).bind(article.series_id).all();
      article.series_articles = seriesResults || [];
    }

    // ── Content-based Related Articles Recommendation ──
    try {
      // Fetch all other articles with enough data for similarity scoring
      const { results: allArticles } = await env.DB.prepare(
        'SELECT id, title, category, summary, tags, content, series_id FROM articles WHERE id != ? ORDER BY date DESC LIMIT 100'
      ).bind(id).all();

      if (allArticles && allArticles.length > 0) {
        // Prepare current article features
        const currentFeatures = {
          ...article,
          _tags: article.tags, // already parsed
          _keywords: extractKeywords(article.content),
        };

        // Score each candidate
        const scored = allArticles.map(candidate => {
          let candidateTags = [];
          try { candidateTags = JSON.parse(candidate.tags || '[]'); } catch { /* */ }

          const candidateFeatures = {
            ...candidate,
            _tags: candidateTags,
            _keywords: extractKeywords(candidate.content),
          };

          const similarity = computeSimilarity(currentFeatures, candidateFeatures);

          return {
            id: candidate.id,
            title: candidate.title,
            category: candidate.category,
            summary: candidate.summary,
            similarity: Math.round(similarity * 100), // percentage for debugging
          };
        });

        // Take top 4 with similarity > 5%
        article.related_articles = scored
          .filter(a => a.similarity > 5)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 4);

        // If not enough similar articles, fill with same category
        if (article.related_articles.length < 3) {
          const usedIds = new Set(article.related_articles.map(a => a.id));
          const fill = scored
            .filter(a => !usedIds.has(a.id) && a.category === article.category)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3 - article.related_articles.length);
          article.related_articles.push(...fill);
        }
      } else {
        article.related_articles = [];
      }
    } catch (simErr) {
      // Fallback: simple same-category
      const { results: autoRelated } = await env.DB.prepare(
        'SELECT id, title, category, summary FROM articles WHERE category = ? AND id != ? ORDER BY date DESC LIMIT 3'
      ).bind(article.category, id).all();
      article.related_articles = autoRelated || [];
    }

    return new Response(JSON.stringify(article), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}

export async function onRequestPut(context) {
  const { env, params, request } = context;
  const { id } = params;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json();
    const { title, category, tags, summary, content, date, series_id, series_order, related_ids } = body;

    // Dynamically build SET clauses — only update fields that were explicitly provided
    const setClauses = [];
    const bindValues = [];

    if (title !== undefined) { setClauses.push('title = ?'); bindValues.push(title); }
    if (date !== undefined) { setClauses.push('date = ?'); bindValues.push(date); }
    if (category !== undefined) { setClauses.push('category = ?'); bindValues.push(category); }
    if (tags !== undefined) {
      // Normalize tags to consistent casing
      const normalized = normalizeTags(tags);
      setClauses.push('tags = ?'); bindValues.push(JSON.stringify(normalized));
    }
    if (summary !== undefined) { setClauses.push('summary = ?'); bindValues.push(summary); }
    if (content !== undefined) { setClauses.push('content = ?'); bindValues.push(content); }
    if (related_ids !== undefined) { setClauses.push('related_ids = ?'); bindValues.push(JSON.stringify(related_ids)); }

    // series_id and series_order can be explicitly set to null (to clear them)
    if ('series_id' in body) { setClauses.push('series_id = ?'); bindValues.push(series_id ?? null); }
    if ('series_order' in body) { setClauses.push('series_order = ?'); bindValues.push(series_order ?? null); }

    if (setClauses.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers,
      });
    }

    setClauses.push("updated_at = datetime('now')");
    bindValues.push(id);

    const sql = `UPDATE articles SET ${setClauses.join(', ')} WHERE id = ?`;
    await env.DB.prepare(sql).bind(...bindValues).run();

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const { id } = params;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}

// CORS preflight is handled by _middleware.js

