// Cloudflare Pages Function — GET /api/articles
// Lists all articles or a single article by ID

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // List all articles (ordered by date desc)
    const { results } = await env.DB.prepare(
      'SELECT id, title, date, category, tags, summary, created_at FROM articles ORDER BY date DESC'
    ).all();

    // Parse tags JSON string back to array
    const articles = results.map(a => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
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
    const { title, category, tags, summary, content } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers,
      });
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const date = new Date().toISOString().split('T')[0];
    const tagsJson = JSON.stringify(tags || []);

    await env.DB.prepare(
      'INSERT INTO articles (id, title, date, category, tags, summary, content) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, title, date, category || 'LLM', tagsJson, summary || '', content).run();

    return new Response(JSON.stringify({ id, title, date, category, tags }), {
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

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
