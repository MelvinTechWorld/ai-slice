// lib/storage/r2.ts
//
// R2 is S3-compatible. Cloudflare has no first-party R2 SDK for Node, so
// per the brief's explicit allowance ("Where a provider has none for your
// platform, use a compatible official SDK pointed at their endpoint, and
// explain that in your documentation") this uses the official AWS SDK v3
// S3 client, pointed at R2's endpoint. Document this choice in Section 5
// under "Why files live in object storage."

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AI_CONFIG } from "@/lib/ai/config";

const accountId = process.env.STORAGE_ACCOUNT_ID;
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error(
    "Missing STORAGE_ACCOUNT_ID / STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY in .env"
  );
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

export async function uploadToR2(key: string, body: Buffer, contentType: string) {
  await r2.send(
    new PutObjectCommand({
      Bucket: AI_CONFIG.storage.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

// Used by the worker to pull the file back down to send to Gemini. The
// SDK returns a Node.js Readable stream for Body in a Node runtime — this
// drains it into a single Buffer.
export async function downloadFromR2(key: string): Promise<Buffer> {
  const result = await r2.send(
    new GetObjectCommand({
      Bucket: AI_CONFIG.storage.bucket,
      Key: key,
    })
  );

  const stream = result.Body as AsyncIterable<Uint8Array>;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// Signed, short-lived URL so the result view can show the original image
// without the bucket being public and without the file ever passing
// through our own database.
export async function getSignedReceiptUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: AI_CONFIG.storage.bucket,
    Key: key,
  });
  return getSignedUrl(r2, command, {
    expiresIn: AI_CONFIG.storage.signedUrlTtlSeconds,
  });
}