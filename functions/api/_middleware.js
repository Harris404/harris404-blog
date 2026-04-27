// Shared authentication middleware for all API endpoints
// Validates Bearer token on write operations (POST, PUT, DELETE)

const WRITE_METHODS = ['POST', 'PUT', 'DELETE'];
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Paths that handle their own auth (e.g., login endpoint)
const AUTH_EXEMPT_PATHS = ['/api/auth'];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Handle CORS preflight for all API routes
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  // Skip auth check for exempt paths and read-only methods
  if (AUTH_EXEMPT_PATHS.some(p => url.pathname.startsWith(p))) {
    return next();
  }

  if (!WRITE_METHODS.includes(request.method)) {
    return next();
  }

  // Validate Bearer token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = atob(token);
    const parts = decoded.split(':');

    if (parts.length < 3 || parts[0] !== 'admin') {
      throw new Error('Invalid token format');
    }

    const timestamp = Number(parts[1]);
    if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_TTL_MS) {
      return new Response(JSON.stringify({ error: 'Token expired, please login again' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  return next();
}
