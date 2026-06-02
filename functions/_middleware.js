// Root Pages middleware — server-side injection of per-article SEO/social meta.
//
// The app is a client-side SPA: article <title> and Open Graph tags are only
// set by React (Helmet) AFTER JavaScript runs. Social link unfurlers
// (WeChat, Twitter/X, LinkedIn, Slack, Facebook) do NOT run JS, so a shared
// article link would otherwise show the generic site title/description.
//
// For /article/<id> HTML responses we look the article up in D1 and rewrite
// the shell's <title> + og/twitter meta with the real title & summary before
// streaming it to the client. JS then renders the same values — consistent.

function stripToText(md) {
  return (md || '')
    .replace(/```[\s\S]*?```/g, ' ')          // fenced code / svg blocks
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')     // raw inline svg
    .replace(/<[^>]+>/g, ' ')                   // other html tags
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')          // display math
    .replace(/\$[^$\n]*?\$/g, ' ')              // inline math
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')      // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')    // links -> text
    .replace(/[#>*`_~|]+/g, ' ')                // md punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function escAttr(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Only touch article page navigations; everything else passes straight through.
  if (!url.pathname.startsWith('/article/')) return next();

  const res = await next();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return res;

  const id = decodeURIComponent(
    url.pathname.slice('/article/'.length).split('/')[0].split('?')[0]
  );
  if (!id || !env.DB) return res;

  let row;
  try {
    // Only public articles get server-injected meta — never leak private ones.
    row = await env.DB
      .prepare('SELECT title, summary, content FROM articles WHERE id = ? AND is_public = 1')
      .bind(id)
      .first();
  } catch {
    return res; // DB hiccup — serve the unmodified shell
  }
  if (!row) return res;

  const fullTitle = `${row.title} — Paris-blog`;
  const desc =
    (row.summary && row.summary.trim()) ||
    stripToText(row.content).slice(0, 160);
  const ogUrl = `${url.origin}/article/${id}`;

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(fullTitle); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', desc); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', row.title); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', desc); } })
    .on('meta[property="og:type"]', { element(el) { el.setAttribute('content', 'article'); } })
    .on('head', {
      element(el) {
        el.append(`<meta property="og:url" content="${escAttr(ogUrl)}">`, { html: true });
        el.append(`<meta name="twitter:title" content="${escAttr(row.title)}">`, { html: true });
        el.append(`<meta name="twitter:description" content="${escAttr(desc)}">`, { html: true });
      },
    })
    .transform(res);
}
