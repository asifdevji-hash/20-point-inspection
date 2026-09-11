import crypto from "crypto";

// ---- Password hashing (Node's built-in scrypt, no extra dependency) ----

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const derived = crypto.scryptSync(password, salt, 64);
  const hashBuf = Buffer.from(hash, "hex");
  if (derived.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(derived, hashBuf);
}

// ---- Signed session tokens (HMAC-SHA256, no extra dependency) ----

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET env var is not set. Generate one with `openssl rand -hex 32` " +
        "and add it in Vercel's Environment Variables."
    );
  }
  return secret;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function signToken(payload, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const body = { ...payload, exp: Date.now() + maxAgeSeconds * 1000 };
  const encoded = base64url(JSON.stringify(body));
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "tech_session";
export const ADMIN_COOKIE = "admin_session";

// Reads and verifies the technician session from a NextRequest-like object
// (anything with a `.cookies.get(name)` method — works for both
// `NextRequest` in middleware/route handlers and the `cookies()` helper).
export function readSession(cookieStore) {
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verifyToken(raw);
  if (!payload || payload.type !== "technician") return null;
  return payload;
}

export function readAdminSession(cookieStore) {
  const raw = cookieStore.get(ADMIN_COOKIE)?.value;
  const payload = verifyToken(raw);
  if (!payload || payload.type !== "admin") return null;
  return payload;
}
