// src/lib/allowlist/types.ts
//
// Any data source (Google Sheets, a database, Airtable, a JSON file,
// whatever) can back the allowlist as long as it implements
// AllowlistProvider and returns entries shaped like AllowlistEntry.

import type { AllowlistSheetRow } from "../sheets/types";

export type { RsvpStatus } from "../sheets/types";

export interface AllowlistProvider {
  /**
   * Look up an email (already trimmed + lowercased by the caller).
   * Return the matching entry, or null if there's no match.
   * Should throw on a genuine lookup failure (network error,
   * misconfiguration, etc.) — the caller treats a thrown error as
   * "fail closed" and denies access, distinct from "no match".
   */
  checkAllowlist(email: string): Promise<AllowlistSheetRow | null>;
}
