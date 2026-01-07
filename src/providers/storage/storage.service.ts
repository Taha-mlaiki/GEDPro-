import { Inject, Injectable } from '@nestjs/common';
import {
  type IStorageProvider,
  STORAGE_PROVIDER,
  type UploadOptions,
  type StorageObject,
} from './storage.interface';
import { TenantContextService } from '../../common/services/tenant-context.service';

/**
 * Storage Service
 *
 * High-level service that wraps IStorageProvider with tenant-scoped bucket logic.
 * This is the service that business modules should inject and use.
 *
 * BUCKET NAMING: tenant-{organizationId}
 * - Automatically prefixes bucket names with tenant ID
 * - Ensures physical isolation between organizations
 */
@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Get the bucket name for the current tenant
   */
  private getTenantBucket(): string {
    const orgId = this.tenantContext.getOrganizationId();
    return `tenant-${orgId}`;
  }

  /**
   * Upload a file for the current tenant
   */
  async uploadFile(
    key: string,
    body: Buffer,
    options?: UploadOptions,
  ): Promise<string> {
    const bucket = this.getTenantBucket();
    return this.storage.upload(bucket, key, body, options);
  }

  /**
   * Upload a file to a specific folder
   */
  async uploadToFolder(
    folder: string,
    filename: string,
    body: Buffer,
    options?: UploadOptions,
  ): Promise<string> {
    const key = `${folder}/${filename}`;
    return this.uploadFile(key, body, options);
  }

  /**
   * Download a file for the current tenant
   */
  async downloadFile(key: string): Promise<Buffer> {
    const bucket = this.getTenantBucket();
    return this.storage.download(bucket, key);
  }

  /**
   * Delete a file for the current tenant
   */
  async deleteFile(key: string): Promise<void> {
    const bucket = this.getTenantBucket();
    return this.storage.delete(bucket, key);
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    const bucket = this.getTenantBucket();
    return this.storage.deleteMany(bucket, keys);
  }

  /**
   * List files in a folder
   */
  async listFiles(prefix?: string): Promise<StorageObject[]> {
    const bucket = this.getTenantBucket();
    return this.storage.listObjects(bucket, prefix);
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    const bucket = this.getTenantBucket();
    return this.storage.exists(bucket, key);
  }

  /**
   * Get a temporary download URL (for direct client download)
   */
  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const bucket = this.getTenantBucket();
    return this.storage.getSignedUrl(bucket, key, expiresIn);
  }

  /**
   * Upload a document with structured naming
   * Organizes files by type: documents/{candidateId}/{filename}
   */
  async uploadCandidateDocument(
    candidateId: number,
    filename: string,
    body: Buffer,
    contentType?: string,
  ): Promise<string> {
    const key = `documents/candidates/${candidateId}/${Date.now()}-${filename}`;
    return this.uploadFile(key, body, { contentType });
  }
}
