import { z } from 'zod';

/**
 * Organization Zod Schemas
 *
 * Using Zod for validation to match the candidates module pattern.
 * Provides runtime type inference and better error messages.
 */

// Base organization schema for creation
export const CreateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be at most 100 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
  isActive: z.boolean().optional().default(true),
});

export type CreateOrganizationDTO = z.infer<typeof CreateOrganizationSchema>;

// Schema for updating organization (all fields optional)
export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();
export type UpdateOrganizationDTO = z.infer<typeof UpdateOrganizationSchema>;

// Query params for listing organizations
export const ListOrganizationsQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type ListOrganizationsQueryDTO = z.infer<
  typeof ListOrganizationsQuerySchema
>;
