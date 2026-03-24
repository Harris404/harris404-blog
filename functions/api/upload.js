// Cloudflare Pages Function — POST /api/upload
// Uploads an image to R2 and returns the public URL

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function onRequestPost(context) {
  const { env, request } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Verify auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), {
        status: 400,
        headers,
      });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers,
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({
        error: `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      }), {
        status: 400,
        headers,
      });
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 5MB`,
      }), {
        status: 400,
        headers,
      });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const uuid = crypto.randomUUID().slice(0, 8);
    const key = `uploads/${timestamp}-${uuid}.${ext}`;

    // Upload to R2
    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Build public URL
    // R2 custom domain or default public URL pattern
    const url = new URL(request.url);
    const imageUrl = `${url.origin}/api/images/${key}`;

    return new Response(JSON.stringify({ url: imageUrl, key }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
