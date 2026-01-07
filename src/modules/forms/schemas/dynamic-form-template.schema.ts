import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Dynamic Form Template - Mongoose Schema
 *
 * Stores form definitions in MongoDB for flexible JSON structure.
 *
 * WHY MONGODB FOR FORMS?
 * - Flexible schema for varying field configurations
 * - Easy to store deeply nested structures
 * - No migrations needed when adding field types
 *
 * ALTERNATIVE: PostgreSQL JSONB
 * - Would work but less natural for document-style data
 * - Harder to query/index nested properties
 */

// Field definition subdocument
@Schema({ _id: false })
export class ValidationRules {
  @Prop({ default: false })
  required: boolean;

  @Prop()
  minLength?: number;

  @Prop()
  maxLength?: number;

  @Prop()
  min?: number;

  @Prop()
  max?: number;

  @Prop()
  pattern?: string;

  @Prop()
  patternMessage?: string;
}

@Schema({ _id: false })
export class FieldOption {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  value: string;
}

@Schema({ _id: false })
export class ConditionalLogic {
  @Prop({ required: true })
  dependsOn: string;

  @Prop({
    required: true,
    enum: ['equals', 'notEquals', 'contains', 'isEmpty', 'isNotEmpty'],
  })
  operator: string;

  @Prop({ type: Object })
  value?: string | number | boolean;
}

@Schema({ _id: false })
export class FormField {
  @Prop({ required: true })
  id: string;

  @Prop({
    required: true,
    enum: [
      'text',
      'textarea',
      'number',
      'email',
      'phone',
      'date',
      'select',
      'multiselect',
      'checkbox',
      'radio',
      'file',
      'signature',
    ],
  })
  type: string;

  @Prop({ required: true })
  label: string;

  @Prop()
  placeholder?: string;

  @Prop()
  helpText?: string;

  @Prop({ type: Object })
  defaultValue?: any;

  @Prop({ type: [FieldOption] })
  options?: FieldOption[];

  @Prop({ type: ValidationRules })
  validation?: ValidationRules;

  @Prop({ type: ConditionalLogic })
  conditionalLogic?: ConditionalLogic;

  @Prop({ default: 0 })
  order: number;
}

@Schema({ _id: false })
export class FormSection {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: [FormField], required: true })
  fields: FormField[];

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: false })
  collapsible: boolean;
}

// Main Form Template Document
@Schema({ timestamps: true })
export class DynamicFormTemplate {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [FormSection], required: true })
  sections: FormSection[];

  @Prop({ default: 1 })
  version: number;

  @Prop({ default: true })
  isActive: boolean;

  // Multi-tenancy
  @Prop({ required: true, index: true })
  organizationId: number;

  // Auto-generated timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type DynamicFormTemplateDocument = DynamicFormTemplate & Document;
export const DynamicFormTemplateSchema =
  SchemaFactory.createForClass(DynamicFormTemplate);

// Index for efficient tenant-scoped queries
DynamicFormTemplateSchema.index({ organizationId: 1, isActive: 1 });
