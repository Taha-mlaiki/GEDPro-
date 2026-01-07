import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageProvider,
  StorageObject,
  UploadOptions,
} from './storage.interface';
import { config } from '../../config/config';

/**
 * MinIO Storage Provider
 *
 * Implements IStorageProvider using AWS SDK v3 for S3-compatible storage.
 *
 * WHY AWS SDK INSTEAD OF MINIO SDK?
 * - Same API works for both MinIO and AWS S3
 * - Better TypeScript support
 * - Smaller bundle size with modular imports
 * - Active maintenance and community
 *
 * BUCKET-PER-TENANT STRATEGY:
 * - Each organization gets bucket: "tenant-{organizationId}"
 * - Auto-created on first upload if doesn't exist
 * - Provides physical isolation of data
 *
 * ALTERNATIVE: Single bucket with prefixed paths
 * - Simpler setup but less isolation
 * - Harder to manage per-tenant quotas/backups
 */
@Injectable()
export class MinioStorageProvider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly logger = new Logger(MinioStorageProvider.name);
  private readonly bucketCache = new Set<string>();

  constructor() {
    this.client = new S3Client({
      endpoint: `http${config.MINIO_USE_SSL ? 's' : ''}://${config.MINIO_ENDPOINT}:${config.MINIO_PORT}`,
      region: 'us-east-1', // MinIO ignores region but SDK requires it
      credentials: {
        accessKeyId: config.MINIO_ACCESS_KEY,
        secretAccessKey: config.MINIO_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  /**
   * Upload a file with automatic bucket creation
   */
  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    options?: UploadOptions,
  ): Promise<string> {
    await this.ensureBucketExists(bucket);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: options?.contentType || 'application/octet-stream',
      Metadata: options?.metadata,
    });

    await this.client.send(command);
    this.logger.log(`Uploaded ${key} to bucket ${bucket}`);

    return `${bucket}/${key}`;
  }

  /**
   * Download file content as Buffer
   */
  async download(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`Empty response body for ${bucket}/${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Delete a single object
   */
  async delete(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.client.send(command);
    this.logger.log(`Deleted ${key} from bucket ${bucket}`);
  }

  /**
   * Delete multiple objects in a single request
   */
  async deleteMany(bucket: string, keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    await this.client.send(command);
    this.logger.log(`Deleted ${keys.length} objects from bucket ${bucket}`);
  }

  /**
   * List objects with optional prefix filtering
   */
  async listObjects(bucket: string, prefix?: string): Promise<StorageObject[]> {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await this.client.send(command);

    return (response.Contents || []).map((obj) => ({
      key: obj.Key!,
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
      etag: obj.ETag,
    }));
  }

  /**
   * Ensure bucket exists, create if not
   * Uses in-memory cache to avoid repeated HEAD requests
   */
  async ensureBucketExists(bucket: string): Promise<void> {
    if (this.bucketCache.has(bucket)) {
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      this.bucketCache.add(bucket);
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404)
      ) {
        this.logger.log(`Creating bucket: ${bucket}`);
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
        this.bucketCache.add(bucket);
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if an object exists
   */
  async exists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate pre-signed URL for temporary access
   * Default expiration: 1 hour
   */
  async getSignedUrl(
    bucket: string,
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}
