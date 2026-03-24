// Cloudflare Pages Function — /api/articles/[id]
// GET single article, PUT update, DELETE remove

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
    const { title, category, tags, summary, content } = body;

    await env.DB.prepare(
      `UPDATE articles SET 
        title = COALESCE(?, title), 
        category = COALESCE(?, category), 
        tags = COALESCE(?, tags), 
        summary = COALESCE(?, summary), 
        content = COALESCE(?, content), 
        updated_at = datetime('now') 
      WHERE id = ?`
    ).bind(
      title || null,
      category || null,
      tags ? JSON.stringify(tags) : null,
      summary || null,
      content || null,
      id
    ).run();

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

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
