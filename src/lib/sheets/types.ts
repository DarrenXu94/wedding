// Column-shaped types for the Google Sheets tabs. Keep these aligned with
// the headers documented in Code.gs; application-facing types build on them.

export type RsvpStatus = "yes" | "no";

/** Fixed fields submitted by the RSVP form before conversion to the sheet payload. */
export interface RsvpFormFields {
  coming: RsvpStatus | "";
  dietary: string;
  notes: string;
}

export const RSVP_FORM_FIELD_NAMES = {
  coming: "coming",
  dietary: "dietary",
  notes: "notes",
  plusOnePrefix: "plus-one-",
} as const satisfies { [Field in keyof RsvpFormFields]: Field } & {
  plusOnePrefix: "plus-one-";
};

export type PlusOneFormField = "name" | "dietary";

export function plusOneFormFieldName(
  index: number,
  field: PlusOneFormField,
): `${typeof RSVP_FORM_FIELD_NAMES.plusOnePrefix}${number}-${PlusOneFormField}` {
  return `${RSVP_FORM_FIELD_NAMES.plusOnePrefix}${index}-${field}`;
}

export interface AllowlistSheetRow {
  email: string;
  name: string;
  photo?: string;
  plusOnesAllowed: number;
  rsvpStatus?: RsvpStatus | "";
}

export interface RsvpSheetRow {
  timestamp: Date;
  email: string;
  name: string;
  dietary: string;
  notes: string;
  coming: RsvpStatus | "";
  plusOneData: string; // JSON-encoded array of {name: string, dietary: string} objects, one per plus-one
}

export interface AllowlistLookupResponse {
  match: AllowlistSheetRow | null;
  error?: string;
}

export interface RsvpSubmissionPayload extends Pick<
  RsvpSheetRow,
  "email" | "name" | "dietary" | "notes" | "coming" | "plusOneData"
> {
  action: "submitRsvp";
  secret: string;
}
