// src/lib/allowlist/providers/googleSheets.ts
//
// Current allowlist source: a Google Sheet via the Apps Script web
// app (see Code.gs). Talks to Apps Script exactly as before — only
// where this logic lives has moved.

import type { AllowlistEntry, AllowlistProvider } from "../types";
import type { AllowlistLookupResponse } from "../../sheets/types";

const SHEET_WEB_APP_URL = import.meta.env.SHEET_WEB_APP_URL;
const SHEET_SHARED_SECRET = import.meta.env.SHEET_SHARED_SECRET;

export const googleSheetsProvider: AllowlistProvider = {
  async checkAllowlist(email: string): Promise<AllowlistEntry | null> {
    const url = new URL(SHEET_WEB_APP_URL);
    url.searchParams.set("action", "checkAllowlist");
    url.searchParams.set("email", email);
    url.searchParams.set("secret", SHEET_SHARED_SECRET);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(
        `Allowlist check request failed with status ${res.status}`,
      );
    }

    const data = (await res.json()) as AllowlistLookupResponse;
    if (data.error) {
      throw new Error(`Allowlist check returned an error: ${data.error}`);
    }

    if (!data.match) return null;

    const {
      allowPlusOne,
      email: matchedEmail,
      name,
      photo,
      rsvpStatus,
    } = data.match;
    const plusOnesAllowed = Number(allowPlusOne);

    return {
      email: matchedEmail,
      name,
      photo,
      ...(allowPlusOne !== undefined &&
      allowPlusOne !== "" &&
      Number.isFinite(plusOnesAllowed)
        ? { plusOnesAllowed }
        : {}),
      rsvpStatus: rsvpStatus || undefined,
    } satisfies AllowlistEntry;
  },
};
