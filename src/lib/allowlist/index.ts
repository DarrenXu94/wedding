// src/lib/allowlist/index.ts
//
// This is the one line to change to swap backends — point
// `allowlistProvider` at any object implementing AllowlistProvider.
// Everything else in the app (login.ts, etc.) only imports from
// here and never knows or cares which backend is behind it.

import { googleSheetsProvider } from "./providers/googleSheets";
import type { AllowlistProvider } from "./types";

export const allowlistProvider: AllowlistProvider = googleSheetsProvider;

export type { AllowlistEntry, AllowlistProvider } from "./types";
