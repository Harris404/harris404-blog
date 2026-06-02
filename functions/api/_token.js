// Shared HMAC-signed admin token helpers (Cloudflare Workers runtime).
// Token format:  base64url(payload) "." base64url(HMAC-SHA256(payload, secret))
// payload = "admin:<issued-ms>:<uuid>"
//
// Files prefixed with "_" are NOT routed by Pages — this is a library module
// imported by auth.js (issue) and _middleware.js (verify).

export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const enc = new TextEncoder();

function bytesToB64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function strToB64url(str) {
  return bytesToB64url(enc.encode(str));
}

function b64urlToStr(b64) {
  const b = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b.length % 4 ? '='.repeat(4 - (b.length % 4)) : '';
  const bin = atob(b + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmac(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return bytesToB64url(new Uint8Array(sig));
}

// Constant-time string comparison
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getSecret(env) {
  // Prefer a dedicated secret; fall back to ADMIN_PASSWORD so no extra config
  // is required to start benefiting from signing.
  return env.TOKEN_SECRET || env.ADMIN_PASSWORD || '';
}

export async function issueToken(env) {
  const secret = getSecret(env);
  if (!secret) throw new Error('No token secret configured');
  const payload = `admin:${Date.now()}:${crypto.randomUUID()}`;
  const sig = await hmac(payload, secret);
  return `${strToB64url(payload)}.${sig}`;
}

// Returns { valid: true } on success, or { valid: false, reason } otherwise.
export async function verifyToken(token, env) {
  const secret = getSecret(env);
  if (!secret) return { valid: false, reason: 'no-secret' };
  const dot = token.indexOf('.');
  if (dot < 0) return { valid: false, reason: 'malformed' };

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload;
  try {
    payload = b64urlToStr(payloadB64);
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  const expected = await hmac(payload, secret);
  if (!safeEqual(expected, sig)) return { valid: false, reason: 'bad-signature' };

  const parts = payload.split(':');
  if (parts.length < 3 || parts[0] !== 'admin') return { valid: false, reason: 'bad-payload' };

  const ts = Number(parts[1]);
  if (!Number.isFinite(ts) || Date.now() - ts > TOKEN_TTL_MS) {
    return { valid: false, reason: 'expired' };
  }
  return { valid: true };
}
