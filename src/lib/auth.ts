// src/lib/auth.ts
//
// Signs and verifies the session cookie so its contents can't be
// forged or edited by the browser. The cookie carries the matched
// user's email + name, plus an expiry, and an HMAC signature that
// only the server (which holds SESSION_SECRET) can produce.

import crypto from "node:crypto";

const SECRET = import.meta.env.SESSION_SECRET;

if (!SECRET) {
  throw new Error(
    "SESSION_SECRET is not set. Add a long random string to your .env file, e.g.\n" +
      "SESSION_SECRET=" +
      crypto.randomBytes(32).toString("hex"),
  );
}

export interface SessionPayload {
  email: string;
  name: string;
  allowPlusOne?: string;
  rsvpStatus?: "yes" | "no";
  photo?: string; // R2 object path (e.g. "photos/sam-rivera.jpg"), not a URL
  exp: number; // epoch ms
}

/** Sign a payload into a cookie-safe string: base64url(payload).hmac */
export function createSessionToken(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("hex");
  return `${encoded}.${signature}`;
}

/**
 * Verify a cookie value. Returns the payload if the signature is valid
 * and it hasn't expired, otherwise null. Use this — never trust the
 * cookie's contents without calling this first.
 */
export function verifySessionToken(
  cookieValue: string | undefined | null,
): SessionPayload | null {
  if (!cookieValue) return null;

  const [encoded, signature] = cookieValue.split(".");
  if (!encoded || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("hex");

  // Timing-safe comparison — a plain === here would leak timing info
  // an attacker could use to guess the signature byte by byte.
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null; // signature invalid — cookie was tampered with or forged
  }

  try {
    const payload: SessionPayload = JSON.parse(
      Buffer.from(encoded, "base64url").toString(),
    );
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
}
