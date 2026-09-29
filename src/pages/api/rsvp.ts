// src/pages/api/rsvp.ts
//
// Proxies RSVP submissions to the Apps Script "submitRsvp" endpoint.
// This exists so the shared secret never has to be sent to (or
// embedded in) the browser — the RSVP form on the page posts here,
// and this route attaches the secret before forwarding to Sheets.
// Also requires a valid session, so only people who passed the
// allowlist check can submit an RSVP.

import type { APIRoute } from "astro";
import { createSessionToken } from "../../lib/auth";

const SHEET_WEB_APP_URL = import.meta.env.SHEET_WEB_APP_URL;
const SHEET_SHARED_SECRET = import.meta.env.SHEET_SHARED_SECRET;

export const POST: APIRoute = async ({
  request,
  locals,
  redirect,
  cookies,
}) => {
  const user = locals.user;

  // middleware.ts should already redirect unauthenticated requests
  // away from anything === /, but this route enforces it
  // independently in case it's ever called from elsewhere.
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
    });
  }

  const formData = await request.formData();

  const allFields = Object.fromEntries(formData);
  const dietary = String(allFields["dietary"] || "");
  const notes = String(allFields["notes"] || "");
  const coming = String(allFields["coming"] || "");

  // Fall all fields starting with "plus-one-"
  const plusOneFields = Object.keys(allFields).filter((key) =>
    key.startsWith("plus-one-"),
  );

  // Combine fields that start with the same plus-one-index prefix into a single object for each plus one
  const plusOneData: Record<string, Record<string, string>> = {};
  plusOneFields.forEach((key) => {
    const [_, x, index, field] = key.split("-");
    if (!plusOneData[index]) {
      plusOneData[index] = {};
    }
    plusOneData[index][field] = String(allFields[key] || "");
  });

  // Turn this into an array of [{name: string, dietary: string}, ...] for easier processing on the server side
  const plusOneArray = Object.values(plusOneData);

  const res = await fetch(SHEET_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submitRsvp",
      secret: SHEET_SHARED_SECRET,
      email: user.email,
      name: user.name,
      dietary,
      notes,
      coming,
      plusOneData: JSON.stringify(plusOneArray), // Convert plusOneData to a JSON string
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("RSVP submission failed:", data.error || res.status);
    return redirect("/?rsvp=error");
  }

  // Re-issue the session cookie with the updated RSVP status baked
  // in, so / can hide the form on the very next render
  // without needing to hit the sheet again. Keep the original
  // expiry rather than extending it — this isn't a fresh login.
  const updatedToken = createSessionToken({
    ...user,
    rsvpStatus: coming as "yes" | "no" | undefined,
  });

  cookies.set("site-auth", updatedToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, Math.floor((user.exp - Date.now()) / 1000)),
  });

  return redirect("/?rsvp=success");
};
