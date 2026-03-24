// Cloudflare Pages Function — GET /api/images/uploads/:filename
// Serves images from R2 storage

export async function onRequestGet(context) {
  const { env, params } = context;

  try {
    // The catch-all route params gives us the path segments
    const key = `uploads/${params.path}`;

    const object = await env.IMAGES.get(key);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, { headers });
  } catch (err) {
    return new Response('Error serving image', { status: 500 });
  }
}
