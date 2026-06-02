// Cloudflare Pages Function — /api/series
// GET  → list all series metadata (public)
// POST → create / upsert a series's metadata (admin; guarded by _middleware)

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB
      .prepare('SELECT id, name, icon FROM series ORDER BY name ASC')
      .all();
    return new Response(JSON.stringify(results || []), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const { id, name, icon } = await request.json();
    if (!id || !name) {
      return new Response(JSON.stringify({ error: 'id and name are required' }), { status: 400, headers: JSON_HEADERS });
    }
    await env.DB.prepare(
      `INSERT INTO series (id, name, icon) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, icon = excluded.icon, updated_at = datetime('now')`
    ).bind(id, name, icon || '📚').run();
    return new Response(JSON.stringify({ id, name, icon: icon || '📚' }), { status: 201, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
}
