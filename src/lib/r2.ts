import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
}

/**
 * Returns R2 configuration from environment variables.
 */
export function getR2Config(): R2Config {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    "442ee27fafab567aa3828a2a4ee62738";

  const endpoint =
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID || "";

  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || "";

  const bucketName =
    process.env.R2_BUCKET_NAME || "aeorax-live";

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucketName,
  };
}

let _r2Client: S3Client | null = null;

/**
 * Get or initialize the S3-compatible Cloudflare R2 Client.
 */
export function getR2Client(): S3Client {
  if (!_r2Client) {
    const config = getR2Config();
    _r2Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return _r2Client;
}

/**
 * Verify R2 Bucket connection and accessibility.
 */
export async function testR2Connection(): Promise<{
  success: boolean;
  bucket: string;
  endpoint: string;
  objectCount?: number;
  message: string;
  latencyMs: number;
}> {
  const start = Date.now();
  const config = getR2Config();

  if (!config.accessKeyId || !config.secretAccessKey) {
    return {
      success: false,
      bucket: config.bucketName,
      endpoint: config.endpoint,
      message: "R2 credentials missing (R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY)",
      latencyMs: Date.now() - start,
    };
  }

  try {
    const client = getR2Client();

    // Check bucket existence/access
    await client.send(
      new HeadBucketCommand({
        Bucket: config.bucketName,
      })
    );

    // List recent objects to confirm read/list permissions
    const listResult = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        MaxKeys: 10,
      })
    );

    const latencyMs = Date.now() - start;
    const objectCount = listResult.KeyCount || 0;

    return {
      success: true,
      bucket: config.bucketName,
      endpoint: config.endpoint,
      objectCount,
      message: `Successfully connected to R2 bucket "${config.bucketName}". Found ${objectCount} existing object(s).`,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      bucket: config.bucketName,
      endpoint: config.endpoint,
      message: `R2 connection failed: ${err?.message || String(err)}`,
      latencyMs,
    };
  }
}

/**
 * Generate a pre-signed URL for direct browser upload (PUT).
 * @param key The object path (e.g. `tenants/{tenantId}/recordings/{filename}`)
 * @param contentType The MIME type (e.g. `video/mp4`, `image/png`, `application/pdf`)
 * @param expiresInSeconds Duration in seconds (default: 900 = 15 minutes)
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900
): Promise<{ url: string; key: string; expiresInSeconds: number }> {
  const config = getR2Config();
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  return { url, key, expiresInSeconds };
}

/**
 * Generate a pre-signed URL for secure private download (GET).
 */
export async function createPresignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<{ url: string; key: string }> {
  const config = getR2Config();
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  return { url, key };
}

/**
 * Directly upload a buffer/string object from server to R2.
 */
export async function uploadObjectToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
  metadata?: Record<string, string>
): Promise<{ success: boolean; key: string; bucket: string }> {
  const config = getR2Config();
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: typeof body === "string" ? Buffer.from(body) : body,
      ContentType: contentType,
      Metadata: metadata,
    })
  );

  return { success: true, key, bucket: config.bucketName };
}

/**
 * Delete an object from R2 bucket.
 */
export async function deleteObjectFromR2(key: string): Promise<boolean> {
  const config = getR2Config();
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  );

  return true;
}

/**
 * List objects in the R2 bucket with an optional prefix.
 */
export async function listR2Objects(prefix = "", maxKeys = 100) {
  const config = getR2Config();
  const client = getR2Client();

  const res = await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    })
  );

  return {
    bucket: config.bucketName,
    prefix,
    count: res.KeyCount || 0,
    isTruncated: res.IsTruncated || false,
    objects: (res.Contents || []).map((o) => ({
      key: o.Key,
      size: o.Size,
      lastModified: o.LastModified,
      etag: o.ETag,
    })),
  };
}
