// Shared authentication middleware for all API endpoints
// Validates HMAC-signed Bearer token on write operations (POST, PUT, DELETE)

import { verifyToken } from './_token.js';

const WRITE_METHODS = ['POST', 'PUT', 'DELETE'];

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

  const token = authHeader.slice(7);
  const result = await verifyToken(token, context.env);
  if (!result.valid) {
    const msg = result.reason === 'expired'
      ? 'Token expired, please login again'
      : 'Invalid token';
    return new Response(JSON.stringify({ error: msg }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  return next();
}
