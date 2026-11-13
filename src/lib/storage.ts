import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { put as vercelBlobPut } from '@vercel/blob';

// Neon Object Storage configuration (S3-compatible)
export const isNeonStorageAvailable = Boolean(
  process.env.AWS_ENDPOINT_URL_S3 &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

export const s3Client = isNeonStorageAvailable
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    })
  : null;

export const DEFAULT_BUCKET = 'assets';

export interface UploadOptions {
  bucket?: string;
  contentType?: string;
  access?: 'private' | 'public_read';
}

/**
 * Upload an asset to Neon Object Storage or Vercel Blob
 */
export async function uploadAsset(
  path: string,
  data: Buffer | Uint8Array | string,
  options: UploadOptions = {}
): Promise<{ url: string; key: string; provider: 'neon-s3' | 'vercel-blob' | 'fallback' }> {
  const bucket = options.bucket || DEFAULT_BUCKET;
  const contentType = options.contentType || 'application/octet-stream';

  // 1. Neon Object Storage (Primary S3-compatible store)
  if (s3Client) {
    const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // Neon storage URL or proxied asset path
    const url = `${process.env.AWS_ENDPOINT_URL_S3}/${bucket}/${path}`;
    return {
      url,
      key: path,
      provider: 'neon-s3',
    };
  }

  // 2. Vercel Blob fallback
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
    const blob = await vercelBlobPut(path, buffer, {
      access: 'public',
      contentType,
    });
    return {
      url: blob.url,
      key: path,
      provider: 'vercel-blob',
    };
  }

  // 3. Fallback representation (e.g. data URI for dev or local)
  const base64 = Buffer.from(data).toString('base64');
  return {
    url: `data:${contentType};base64,${base64}`,
    key: path,
    provider: 'fallback',
  };
}

/**
 * Retrieve an asset as a Buffer from Neon Object Storage
 */
export async function downloadAsset(
  key: string,
  bucket = DEFAULT_BUCKET
): Promise<{ buffer: Buffer; contentType?: string }> {
  if (!s3Client) {
    throw new Error('Neon Object Storage (S3) client is not configured.');
  }

  const res = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const array = await res.Body?.transformToByteArray();
  if (!array) {
    throw new Error(`File ${key} is empty or unreadable.`);
  }

  return {
    buffer: Buffer.from(array),
    contentType: res.ContentType,
  };
}

/**
 * Delete an object from Neon Object Storage
 */
export async function deleteAsset(key: string, bucket = DEFAULT_BUCKET): Promise<boolean> {
  if (!s3Client) return false;
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error(`Failed to delete ${key} from ${bucket}:`, err);
    return false;
  }
}

/**
 * List objects in Neon Object Storage
 */
export async function listAssets(prefix?: string, bucket = DEFAULT_BUCKET): Promise<string[]> {
  if (!s3Client) return [];
  const res = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    })
  );
  return (res.Contents || []).map((item) => item.Key || '').filter(Boolean);
}
