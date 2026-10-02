// src/lib/allowlist/providers/googleSheets.ts
//
// Current allowlist source: a Google Sheet via the Apps Script web
// app (see Code.gs). Talks to Apps Script exactly as before — only
// where this logic lives has moved.

import type { AllowlistProvider } from "../types";
import type { AllowlistSheetRow, RsvpStatus } from "../../sheets/types";

const SHEET_WEB_APP_URL = import.meta.env.SHEET_WEB_APP_URL;
const SHEET_SHARED_SECRET = import.meta.env.SHEET_SHARED_SECRET;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const googleSheetsProvider: AllowlistProvider = {
  async checkAllowlist(email: string): Promise<AllowlistSheetRow | null> {
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

    const data: unknown = await res.json();
    if (!isRecord(data)) {
      throw new Error("Allowlist check returned an invalid response");
    }

    if (typeof data.error === "string") {
      throw new Error(`Allowlist check returned an error: ${data.error}`);
    }
    if (data.match === null || data.match === undefined) return null;
    if (!isRecord(data.match)) {
      throw new Error("Allowlist check returned an invalid match");
    }

    const match = data.match;
    const plusOnesAllowed = Number(match.plusOnesAllowed);
    if (
      !Number.isInteger(plusOnesAllowed) ||
      plusOnesAllowed < 0 ||
      (typeof match.plusOnesAllowed !== "number" &&
        typeof match.plusOnesAllowed !== "string") ||
      String(match.plusOnesAllowed).trim() === ""
    ) {
      throw new Error("Allowlist entry has an invalid plusOnesAllowed value");
    }
    if (typeof match.email !== "string" || typeof match.name !== "string") {
      throw new Error("Allowlist entry is missing a valid email or name");
    }
    if (
      match.photo !== undefined &&
      match.photo !== "" &&
      typeof match.photo !== "string"
    ) {
      throw new Error("Allowlist entry has an invalid photo value");
    }
    if (
      match.rsvpStatus !== undefined &&
      match.rsvpStatus !== "" &&
      match.rsvpStatus !== "yes" &&
      match.rsvpStatus !== "no"
    ) {
      throw new Error("Allowlist entry has an invalid rsvpStatus value");
    }

    const rsvpStatus = match.rsvpStatus as RsvpStatus | "" | undefined;

    return {
      email: match.email,
      name: match.name,
      photo: typeof match.photo === "string" ? match.photo : undefined,
      plusOnesAllowed,
      rsvpStatus: rsvpStatus || undefined,
    } satisfies AllowlistSheetRow;
  },
};
