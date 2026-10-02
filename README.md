# Wedding template

- Email protected landing page
- Sign in with an email, email list stored in Google sheets
  - Code.gs should be pasted into AppsScript to allow fetching and posting
- Metadata signed in will show custom landing picture
- Picture stored in Cloudflare R2 bucket

## How to get started

1. degit clone this repo
   1. `npx degit DarrenXu94/wedding`
2. Connect Cloudflare R2 account
   1. Create an R2 API token in the Cloudflare dashboard (R2 → Manage API Tokens)
   2. Scope it to this specific bucket only, with Object Read permission (not Read/Write)
   3. Add to .env
      1. Finding the R2_ACCOUNT_ID: In the Cloudflare dashboard, click R2 in the left sidebar to open the R2 Overview page. Your Account ID is shown in the right-hand panel (sometimes under 'API' or account details), with a copy icon next to it. It's a 32-character hex string, not your email or bucket name.
3. Connect Google sheets 
   1. Google Sheet: Extensions → Apps Script, paste Code.gs in.
   2. Create two tabs: Allowlist and RSVPs
   3. Project Settings → Script Properties → add SHARED_SECRET with a long random string
   4. Deploy → New deployment → Web app → Execute as Me, access Anyone → copy the /exec URL.
   5. Add to .env


## Want to use a different DB?

If you don't want to use Google sheets add your own adapter to /src/lib/allowlist/provider. This is called on login and will check if the email sent is valid.

## Env variables

// Locally used for verifying session token
SESSION_SECRET

// Variables from Cloudflare R2
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME

// Variables from Google sheets API
SHEET_WEB_APP_URL
SHEET_SHARED_SECRET