// src/pages/api/login.ts
//
// Checks the submitted email against the Google Sheet allowlist via
// the Apps Script web app, and sets a signed session cookie on a
// match. The sheet, its contents, and the shared secret never reach
// the browser — only this server route talks to Apps Script.

import type { APIRoute } from "astro";
import { createSessionToken } from "../../lib/auth";

const SHEET_WEB_APP_URL = import.meta.env.SHEET_WEB_APP_URL;
const SHEET_SHARED_SECRET = import.meta.env.SHEET_SHARED_SECRET;
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface AllowlistEntry {
  email: string;
  name: string;
  photo?: string;
  allowPlusOne?: string;
}

async function checkAllowlist(email: string): Promise<AllowlistEntry | null> {
  const url = new URL(SHEET_WEB_APP_URL);
  url.searchParams.set("action", "checkAllowlist");
  url.searchParams.set("email", email);
  url.searchParams.set("secret", SHEET_SHARED_SECRET);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Allowlist check request failed with status ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Allowlist check returned an error: ${data.error}`);
  }

  return data.match ?? null;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const submitted = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!submitted) {
    return redirect("/login?error=1");
  }

  let entry: AllowlistEntry | null;
  try {
    entry = await checkAllowlist(submitted);
  } catch (err) {
    // Sheet/Apps Script unreachable, misconfigured secret, etc.
    // Fail closed — don't let a broken lookup accidentally let anyone in.
    console.error("Allowlist lookup failed:", err);
    return redirect("/login?error=1");
  }

  // Deliberately vague on failure — don't reveal whether an email
  // exists on the list, that turns this into an enumeration endpoint.
  if (!entry) {
    return redirect("/login?error=1");
  }

  const token = createSessionToken({
    email: entry.email,
    name: entry.name,
    allowPlusOne: entry.allowPlusOne,
    photo: entry.photo, // R2 object path — signed URL is generated per-request
    exp: Date.now() + SESSION_DURATION_MS,
  });

  cookies.set("site-auth", token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return redirect("/");
};
