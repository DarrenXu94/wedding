// Column-shaped types for the Google Sheets tabs. Keep these aligned with
// the headers documented in Code.gs; application-facing types build on them.

export type RsvpStatus = "yes" | "no";

export interface AllowlistSheetRow {
  email: string;
  name: string;
  photo?: string;
  allowPlusOne?: number | "";
  rsvpStatus?: RsvpStatus | "";
}

export interface RsvpSheetRow {
  timestamp: Date;
  email: string;
  name: string;
  dietary: string;
  notes: string;
  coming: RsvpStatus | "";
  plusOneData: string;
}

export interface AllowlistLookupResponse {
  match: AllowlistSheetRow | null;
  error?: string;
}

export interface RsvpSubmissionPayload extends Pick<
  RsvpSheetRow,
  "email" | "name" | "dietary" | "notes" | "coming"
> {
  action: "submitRsvp";
  secret: string;
  // Current form/API representation; this is not a Google Sheets column.
  plusOneData: string;
}
