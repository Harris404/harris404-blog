// Cloudflare Pages Function — GET /api/articles
// Lists all articles or a single article by ID

import { verifyToken } from './_token.js';
import { normalizeMarkdown } from './_normalize.js';

// True only when the request carries a valid admin token.
async function isAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const res = await verifyToken(auth.slice(7), env);
  return res.valid === true;
}

// ── Tag Normalization ──────────────────────────────
// Canonical casing for known acronyms and terms
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

  // Check known compound forms first
  if (KNOWN_FORMS[lower]) return KNOWN_FORMS[lower];

  // Check if it's a known acronym
  if (ACRONYMS.has(lower)) return trimmed.toUpperCase();

  // Default: Title Case (capitalize first letter of each word)
  return lower.replace(/(?:^|\s|-)\S/g, c => c.toUpperCase());
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  // Normalize and deduplicate (case-insensitive)
  const seen = new Map();
  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (normalized && !seen.has(normalized.toLowerCase())) {
      seen.set(normalized.toLowerCase(), normalized);
    }
  }
  return [...seen.values()];
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Private articles are visible only to an authenticated admin.
    const admin = await isAdmin(request, env);
    const where = admin ? '' : 'WHERE is_public = 1';

    const { results } = await env.DB.prepare(
      `SELECT id, title, date, category, tags, summary, series_id, series_order, related_ids, is_public, views, created_at FROM articles ${where} ORDER BY date DESC`
    ).all();

    // Parse JSON string fields back to arrays
    const articles = results.map(a => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
      related_ids: JSON.parse(a.related_ids || '[]'),
      is_public: a.is_public !== 0,
    }));

    return new Response(JSON.stringify(articles), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}

// POST /api/articles — Create a new article
export async function onRequestPost(context) {
  const { env, request } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json();
    const { title, category, tags, summary, content, series_id, series_order, related_ids, is_public } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers,
      });
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const date = new Date().toISOString().split('T')[0];
    const tagsJson = JSON.stringify(normalizeTags(tags || []));
    const relatedJson = JSON.stringify(related_ids || []);
    const pub = is_public === false ? 0 : 1; // default public
    const safeContent = normalizeMarkdown(content); // auto-fix render pitfalls

    await env.DB.prepare(
      'INSERT INTO articles (id, title, date, category, tags, summary, content, series_id, series_order, related_ids, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, title, date, category || 'Knowledge', tagsJson, summary || '', safeContent, series_id || null, series_order ?? null, relatedJson, pub).run();

    return new Response(JSON.stringify({ id, title, date, category, tags, is_public: pub === 1 }), {
      status: 201,
      headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
}

// CORS preflight is handled by _middleware.js
