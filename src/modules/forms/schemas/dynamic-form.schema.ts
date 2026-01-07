import { z } from 'zod';

/**
 * Dynamic Form Schema
 *
 * Defines the structure for form builder fields.
 * This schema validates form template definitions, NOT form submissions.
 *
 * NESTED JSON STRUCTURE:
 * - Forms contain sections (for visual grouping)
 * - Sections contain fields
 * - Fields have types, validation rules, and conditional logic
 *
 * WHY ZOD FOR FORM SCHEMA?
 * - Validates complex nested structures
 * - Easy to extend with new field types
 * - Same schema works for frontend form builder
 */

// Supported field types
export const FieldTypeEnum = z.enum([
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
]);

export type FieldType = z.infer<typeof FieldTypeEnum>;

// Select/Radio/Checkbox option
const OptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

// Field validation rules
const ValidationRulesSchema = z.object({
  required: z.boolean().default(false),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(), // Regex pattern
  patternMessage: z.string().optional(), // Custom error for pattern
});

// Conditional display logic
const ConditionalLogicSchema = z.object({
  dependsOn: z.string(), // Field ID this depends on
  operator: z.enum([
    'equals',
    'notEquals',
    'contains',
    'isEmpty',
    'isNotEmpty',
  ]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

// Individual form field
const FormFieldSchema = z.object({
  id: z.string().min(1),
  type: FieldTypeEnum,
  label: z.string().min(1).max(200),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  defaultValue: z.any().optional(),
  options: z.array(OptionSchema).optional(), // For select, radio, checkbox
  validation: ValidationRulesSchema.optional(),
  conditionalLogic: ConditionalLogicSchema.optional(),
  order: z.number().int().min(0).default(0),
});

export type FormField = z.infer<typeof FormFieldSchema>;

// Form section (group of fields)
const FormSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  fields: z.array(FormFieldSchema).min(1),
  order: z.number().int().min(0).default(0),
  collapsible: z.boolean().default(false),
});

export type FormSection = z.infer<typeof FormSectionSchema>;

// Complete form template
export const DynamicFormTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sections: z.array(FormSectionSchema).min(1),
  version: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export type DynamicFormTemplateDTO = z.infer<typeof DynamicFormTemplateSchema>;

// Form submission schema (validates actual form data)
export const FormSubmissionSchema = z.object({
  formTemplateId: z.string().min(1),
  candidateId: z.number().int().optional(),
  data: z.record(z.string(), z.any()), // Key-value pairs of field answers
});

export type FormSubmissionDTO = z.infer<typeof FormSubmissionSchema>;
