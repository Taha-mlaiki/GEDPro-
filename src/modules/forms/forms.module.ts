import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DynamicFormTemplate,
  DynamicFormTemplateSchema,
} from './schemas/dynamic-form-template.schema';
import {
  FormSubmission,
  FormSubmissionSchema,
} from './schemas/form-submission.schema';
import { TenantContextService } from '../../common/services/tenant-context.service';

/**
 * Forms Module
 *
 * Handles dynamic form templates and submissions using MongoDB.
 *
 * DUAL-DATABASE PATTERN:
 * - Form templates and submissions stored in MongoDB (flexible JSON)
 * - References to Candidates and Organizations use PostgreSQL IDs
 * - No real-time sync needed - each DB serves its strength
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DynamicFormTemplate.name, schema: DynamicFormTemplateSchema },
      { name: FormSubmission.name, schema: FormSubmissionSchema },
    ]),
  ],
  providers: [TenantContextService],
  exports: [MongooseModule],
})
export class FormsModule {}
