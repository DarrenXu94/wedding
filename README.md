# Wedding template

- Email protected landing page
- Sign in with an email, email list stored in Google sheets
  - Code.gs should be pasted into AppsScript to allow fetching and posting
- Metadata signed in will show custom landing picture
- Picture stored in Cloudflare R2 bucket

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