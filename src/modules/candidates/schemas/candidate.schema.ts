import { z } from 'zod';
import { CandidateState } from '../entities/candidate.entity';

/**
 * Candidate Zod Schemas
 *
 * WHY ZOD INSTEAD OF CLASS-VALIDATOR?
 * 1. Runtime type inference - DTOs are automatically typed
 * 2. Composable - Nest schemas for complex validations
 * 3. Already in use in this project (consistency)
 * 4. Better error messages out of the box
 *
 * ALTERNATIVE: class-validator with decorators
 * - More commonly seen in NestJS tutorials
 * - Requires duplicate type definitions (class + interface)
 * - Cannot infer types, need manual typing
 */

// Base candidate schema for creation
export const CreateCandidateSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20, 'Phone number too long').optional().nullable(),
  position: z
    .string()
    .max(100, 'Position title too long')
    .optional()
    .nullable(),
  notes: z.string().max(2000, 'Notes too long').optional().nullable(),
});

export type CreateCandidateDTO = z.infer<typeof CreateCandidateSchema>;

// Schema for updating candidate (all fields optional)
export const UpdateCandidateSchema = CreateCandidateSchema.partial();
export type UpdateCandidateDTO = z.infer<typeof UpdateCandidateSchema>;

// Schema for state transition
export const TransitionStateSchema = z.object({
  toState: z.nativeEnum(CandidateState, {
    message: 'Invalid candidate state',
  }),
  notes: z.string().max(500, 'Transition notes too long').optional().nullable(),
});

export type TransitionStateDTO = z.infer<typeof TransitionStateSchema>;

// Query params for listing candidates
export const ListCandidatesQuerySchema = z.object({
  state: z.nativeEnum(CandidateState).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type ListCandidatesQueryDTO = z.infer<typeof ListCandidatesQuerySchema>;
