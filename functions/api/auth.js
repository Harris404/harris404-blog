// Cloudflare Pages Function — POST /api/auth
// Simple password-based admin authentication

import { issueToken } from './_token.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { password } = await request.json();

    // Admin password stored as environment variable
    const adminPassword = env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return new Response(JSON.stringify({ error: 'Admin password not configured' }), {
        status: 500,
        headers,
      });
    }

    if (password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers,
      });
    }

    // Generate an HMAC-signed token (cannot be forged without the secret)
    const token = await issueToken(env);

    return new Response(JSON.stringify({ token }), { headers });
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
