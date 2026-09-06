// src/lib/allowlist/types.ts
//
// Any data source (Google Sheets, a database, Airtable, a JSON file,
// whatever) can back the allowlist as long as it implements
// AllowlistProvider and returns entries shaped like AllowlistEntry.

export interface AllowlistEntry {
  email: string;
  name: string;
  photo?: string; // R2 object path — signed URL is generated per-request
  allowPlusOne?: string;
  rsvpStatus?: "yes" | "no";
}

export interface AllowlistProvider {
  /**
   * Look up an email (already trimmed + lowercased by the caller).
   * Return the matching entry, or null if there's no match.
   * Should throw on a genuine lookup failure (network error,
   * misconfiguration, etc.) — the caller treats a thrown error as
   * "fail closed" and denies access, distinct from "no match".
   */
  checkAllowlist(email: string): Promise<AllowlistEntry | null>;
}
