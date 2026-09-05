// Code.gs — paste this into Extensions > Apps Script on your Google Sheet.
//
// Expects two tabs on the sheet:
//   "Allowlist" — columns: email | name | photo | allowPlusOne | rsvpStatus
//   "RSVPs"     — columns: timestamp | email | name | dietary | notes | coming | plusOneName
//
// Before deploying, set a shared secret so only your server can call
// this (the deployed URL is reachable by anyone who has it, since
// Apps Script web apps don't support IP allowlisting):
//   Project Settings (gear icon) > Script Properties > Add property
//   Name: SHARED_SECRET   Value: <a long random string>
//
// Then: Deploy > New deployment > type "Web app" >
//   Execute as: Me
//   Who has access: Anyone
// Copy the resulting /exec URL — that's your SHEET_WEB_APP_URL.
//
// Note: Apps Script web apps always return HTTP 200 to the caller,
// even on an error — there's no way to set a custom status code.
// Callers must check the `success` / `error` field in the JSON body,
// not the HTTP status.

const ALLOWLIST_SHEET_NAME = "Allowlist";
const RSVP_SHEET_NAME = "RSVPs";

function doGet(e) {
  const secret =
    PropertiesService.getScriptProperties().getProperty("SHARED_SECRET");
  if (e.parameter.secret !== secret) {
    return jsonResponse({ error: "unauthorized" });
  }

  if (e.parameter.action === "checkAllowlist") {
    return handleCheckAllowlist(e.parameter.email);
  }

  return jsonResponse({ error: "unknown action" });
}

function doPost(e) {
  const secret =
    PropertiesService.getScriptProperties().getProperty("SHARED_SECRET");
  const body = JSON.parse(e.postData.contents);

  if (body.secret !== secret) {
    return jsonResponse({ error: "unauthorized" });
  }

  if (body.action === "submitRsvp") {
    return handleSubmitRsvp(body);
  }

  return jsonResponse({ error: "unknown action" });
}

function handleCheckAllowlist(email) {
  if (!email) return jsonResponse({ match: null });

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ALLOWLIST_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h).trim().toLowerCase());

  const emailCol = headers.indexOf("email");
  const nameCol = headers.indexOf("name");
  const allowPlusOneCol = headers.indexOf("allowplusone");
  const photoCol = headers.indexOf("photo");
  const statusCol = headers.indexOf("rsvpstatus");

  const normalized = String(email).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[emailCol]).trim().toLowerCase() === normalized) {
      return jsonResponse({
        match: {
          email: row[emailCol],
          name: row[nameCol],
          allowPlusOne: allowPlusOneCol > -1 ? row[allowPlusOneCol] : undefined,
          photo: photoCol > -1 ? row[photoCol] : undefined,
          rsvpStatus: statusCol > -1 ? row[statusCol] : undefined,
        },
      });
    }
  }

  return jsonResponse({ match: null });
}

function handleSubmitRsvp(body) {
  const rsvpSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RSVP_SHEET_NAME);
  rsvpSheet.appendRow([
    new Date(),
    body.email || "",
    body.name || "",
    body.dietary || "",
    body.notes || "",
    body.coming || "",
    body.plusOneName || "",
  ]);

  updateAllowlistRsvpStatus(body.email, body.coming);

  return jsonResponse({ success: true });
}

function updateAllowlistRsvpStatus(email, status) {
  if (!email) return;

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ALLOWLIST_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h).trim().toLowerCase());

  const emailCol = headers.indexOf("email");
  const rsvpStatusCol = headers.indexOf("rsvpstatus");

  if (emailCol === -1 || rsvpStatusCol === -1) {
    Logger.log(
      'updateAllowlistRsvpStatus: missing "email" or "rsvpStatus" column in Allowlist tab',
    );
    return;
  }

  const normalized = String(email).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][emailCol]).trim().toLowerCase() === normalized) {
      // +1 on both: getRange is 1-indexed, and data[0] is the header
      // row, so data row i is sheet row i+1.
      sheet.getRange(i + 1, rsvpStatusCol + 1).setValue(status);
      return;
    }
  }

  Logger.log("updateAllowlistRsvpStatus: no allowlist row found for " + email);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
