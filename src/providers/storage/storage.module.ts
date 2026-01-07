import { Global, Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.interface';
import { MinioStorageProvider } from './minio-storage.provider';
import { StorageService } from './storage.service';
import { TenantContextService } from '../../common/services/tenant-context.service';

/**
 * Storage Module
 *
 * Provides object storage capabilities with pluggable providers.
 *
 * PROVIDER SWAPPING:
 * To switch from MinIO to AWS S3 or Azure Blob:
 * 1. Create a new provider implementing IStorageProvider
 * 2. Change the useClass in the provider below
 * 3. No changes needed in business logic
 *
 * CONFIG-BASED SWITCHING (Future Enhancement):
 * Use useFactory with config to dynamically select provider:
 *
 * {
 *   provide: STORAGE_PROVIDER,
 *   useFactory: (config: ConfigService) => {
 *     switch (config.get('STORAGE_PROVIDER')) {
 *       case 'aws': return new AwsS3StorageProvider();
 *       case 'azure': return new AzureBlobStorageProvider();
 *       default: return new MinioStorageProvider();
 *     }
 *   },
 *   inject: [ConfigService],
 * }
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: MinioStorageProvider,
    },
    TenantContextService,
    StorageService,
  ],
  exports: [STORAGE_PROVIDER, StorageService, TenantContextService],
})
export class StorageModule {}
