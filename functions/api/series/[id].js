// Cloudflare Pages Function — /api/series/[id]
// GET → one series's metadata (public)
// PUT → rename / change icon (admin; guarded by _middleware)
// DELETE → remove series metadata row (admin)
//
// Note: PUT only edits metadata (name, icon). The series id itself is the key
// referenced by articles.series_id, so it is intentionally immutable here.

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    const row = await env.DB
      .prepare('SELECT id, name, icon FROM series WHERE id = ?')
      .bind(params.id)
      .first();
    if (!row) {
      return new Response(JSON.stringify({ error: 'Series not found' }), { status: 404, headers: JSON_HEADERS });
    }
    return new Response(JSON.stringify(row), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
}

export async function onRequestPut(context) {
  const { env, params, request } = context;
  try {
    const body = await request.json();
    const { name, icon } = body;

    const sets = [];
    const vals = [];
    if (name !== undefined) { sets.push('name = ?'); vals.push(name); }
    if (icon !== undefined) { sets.push('icon = ?'); vals.push(icon || '📚'); }
    if (sets.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: JSON_HEADERS });
    }
    sets.push("updated_at = datetime('now')");

    // Upsert: if the metadata row doesn't exist yet (legacy series), create it.
    const existing = await env.DB.prepare('SELECT id FROM series WHERE id = ?').bind(params.id).first();
    if (existing) {
      vals.push(params.id);
      await env.DB.prepare(`UPDATE series SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
    } else {
      await env.DB.prepare('INSERT INTO series (id, name, icon) VALUES (?, ?, ?)')
        .bind(params.id, name || params.id, icon || '📚').run();
    }
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    await env.DB.prepare('DELETE FROM series WHERE id = ?').bind(params.id).run();
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: JSON_HEADERS });
  }
}
