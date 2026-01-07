/**
 * Storage Provider Interface
 *
 * DESIGN RATIONALE:
 * This interface abstracts object storage operations, enabling:
 * - Easy swapping between MinIO, AWS S3, Azure Blob, GCP Storage
 * - Unit testing with mock implementations
 * - Future migration without changing business logic
 *
 * WHY INTERFACE + DI TOKEN?
 * - NestJS DI works with tokens, not interfaces (TypeScript limitation)
 * - Allows runtime provider selection based on config
 */

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface IStorageProvider {
  /**
   * Upload a file to storage
   * @param bucket - Bucket name (will be prefixed for tenant isolation)
   * @param key - Object key/path within the bucket
   * @param body - File content as Buffer
   * @param options - Optional upload settings
   * @returns URL or key of the uploaded object
   */
  upload(
    bucket: string,
    key: string,
    body: Buffer,
    options?: UploadOptions,
  ): Promise<string>;

  /**
   * Download a file from storage
   * @returns File content as Buffer
   */
  download(bucket: string, key: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   */
  delete(bucket: string, key: string): Promise<void>;

  /**
   * Delete multiple files from storage
   */
  deleteMany(bucket: string, keys: string[]): Promise<void>;

  /**
   * List objects in a bucket with optional prefix filter
   */
  listObjects(bucket: string, prefix?: string): Promise<StorageObject[]>;

  /**
   * Ensure a bucket exists, creating it if necessary
   */
  ensureBucketExists(bucket: string): Promise<void>;

  /**
   * Check if an object exists
   */
  exists(bucket: string, key: string): Promise<boolean>;

  /**
   * Generate a pre-signed URL for temporary access
   * @param expiresIn - Expiration time in seconds
   */
  getSignedUrl(
    bucket: string,
    key: string,
    expiresIn?: number,
  ): Promise<string>;
}

/**
 * DI Token for IStorageProvider
 * Use this for injection: @Inject(STORAGE_PROVIDER)
 */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
