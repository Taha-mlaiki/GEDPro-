import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Form Submission - Mongoose Schema
 *
 * Stores form submissions with flexible data structure.
 * Links to PostgreSQL entities via IDs (candidateId, organizationId).
 *
 * POLYGLOT PERSISTENCE PATTERN:
 * - MongoDB stores flexible JSON submission data
 * - PostgreSQL stores relational data (Candidate, Organization)
 * - Application layer handles joins when needed
 */

// OCR Metadata for scanned documents
@Schema({ _id: false })
export class OcrMetadata {
  @Prop()
  ocrProvider?: string; // e.g., 'tesseract', 'google-vision', 'aws-textract'

  @Prop()
  confidence?: number; // Overall confidence score 0-100

  @Prop({ type: Object })
  rawOutput?: Record<string, any>; // Provider-specific raw response

  @Prop()
  processedAt?: Date;

  @Prop()
  documentType?: string; // e.g., 'resume', 'id-card', 'diploma'
}

// Individual field extraction from OCR
@Schema({ _id: false })
export class ExtractedField {
  @Prop({ required: true })
  fieldName: string;

  @Prop({ type: Object })
  value: any;

  @Prop()
  confidence?: number;

  @Prop({ type: Object })
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

@Schema({ timestamps: true })
export class FormSubmission {
  @Prop({ required: true, index: true })
  formTemplateId: string; // Reference to DynamicFormTemplate._id

  @Prop({ index: true })
  candidateId?: number; // Reference to PostgreSQL Candidate

  // Multi-tenancy
  @Prop({ required: true, index: true })
  organizationId: number;

  // Form field values
  @Prop({ type: Object, required: true })
  data: Record<string, any>;

  // Submission metadata
  @Prop()
  submittedById?: number; // User who submitted

  @Prop({
    default: 'pending',
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
  })
  status: string;

  // OCR-related data (if form was filled via document scanning)
  @Prop({ type: OcrMetadata })
  ocrMetadata?: OcrMetadata;

  @Prop({ type: [ExtractedField] })
  extractedFields?: ExtractedField[];

  // Source document reference (stored in MinIO)
  @Prop()
  sourceDocumentUrl?: string;

  // Auto-generated timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type FormSubmissionDocument = FormSubmission & Document;
export const FormSubmissionSchema =
  SchemaFactory.createForClass(FormSubmission);

// Compound indexes for common queries
FormSubmissionSchema.index({ organizationId: 1, candidateId: 1 });
FormSubmissionSchema.index({ organizationId: 1, formTemplateId: 1 });
FormSubmissionSchema.index({ organizationId: 1, status: 1 });
