// Cloudflare Pages Function — GET /api/feed.xml
// Generates an RSS 2.0 feed of all articles

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const siteUrl = url.origin;

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, title, date, category, tags, summary FROM articles ORDER BY date DESC LIMIT 50'
    ).all();

    const items = results.map(article => {
      const tags = JSON.parse(article.tags || '[]');
      const categories = tags.map(t => `<category>${escapeXml(t)}</category>`).join('\n        ');

      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${siteUrl}/article/${article.id}</link>
      <guid isPermaLink="true">${siteUrl}/article/${article.id}</guid>
      <description>${escapeXml(article.summary || '')}</description>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <category>${escapeXml(article.category)}</category>
      ${categories}
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Paris-blog</title>
    <link>${siteUrl}</link>
    <description>Deep dives into AI architectures, LLM paper analyses, and practical code implementations.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
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

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
