// Cloudflare Pages Function — GET /api/sitemap.xml
// Generates a dynamic sitemap from all articles in D1

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const siteUrl = url.origin;

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, updated_at, date FROM articles ORDER BY date DESC'
    ).all();

    const articleUrls = results.map(article => {
      const lastmod = article.updated_at || article.date;
      return `
  <url>
    <loc>${siteUrl}/article/${article.id}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/graph</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${siteUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  ${articleUrls}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(`<!-- Error: ${err.message} -->`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
