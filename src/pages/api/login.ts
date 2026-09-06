// src/pages/api/login.ts
//
// Checks the submitted email against the active allowlist provider
// and sets a signed session cookie on a match. The provider's
// details (Google Sheets, a database, whatever) are fully abstracted
// behind lib/allowlist — this file never talks to Apps Script or any
// other backend directly.

import type { APIRoute } from "astro";
import { createSessionToken } from "../../lib/auth";
import { allowlistProvider } from "../../lib/allowlist";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const submitted = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!submitted) {
    return redirect("/login?error=1");
  }

  let entry;
  try {
    entry = await allowlistProvider.checkAllowlist(submitted);
  } catch (err) {
    // Provider unreachable, misconfigured, etc. Fail closed — don't
    // let a broken lookup accidentally let anyone in.
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
    rsvpStatus: entry.rsvpStatus,
    photo: entry.photo,
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
