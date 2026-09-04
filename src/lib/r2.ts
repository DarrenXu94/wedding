// src/lib/r2.ts
//
// Generates short-lived signed URLs for private photos stored in
// Cloudflare R2. Nothing in the bucket is publicly reachable — a URL
// is only ever minted here, server-side, after the session has
// already been verified by middleware.

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = import.meta.env.R2_ACCOUNT_ID;
const accessKeyId = import.meta.env.R2_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  throw new Error(
    "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
      "R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in your .env file.",
  );
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

// Short expiry on purpose: long enough for the image to load on the
// page, short enough that a copied/leaked link goes stale fast.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 5;

/**
 * Returns a signed, time-limited URL for a photo stored in the R2
 * bucket, or null if no path was given. Call this fresh on every
 * request that needs to display the photo — don't cache or store
 * the signed URL itself anywhere (store the object path instead).
 */
export async function getSignedPhotoUrl(
  photoPath: string | null | undefined,
): Promise<string | null> {
  if (!photoPath) return null;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: photoPath,
  });

  return getSignedUrl(r2, command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS });
}
