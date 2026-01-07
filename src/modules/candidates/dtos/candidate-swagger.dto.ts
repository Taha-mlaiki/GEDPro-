/**
 * Swagger DTOs for Candidates Module
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// REQUEST DTOs
// ============================================

export class CreateCandidateDto {
    @ApiProperty({
        example: 'John',
        description: 'Candidate first name',
        minLength: 2,
        maxLength: 50,
    })
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: 'Candidate last name',
        minLength: 2,
        maxLength: 50,
    })
    lastName: string;

    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'Candidate email address',
        format: 'email',
    })
    email: string;

    @ApiPropertyOptional({
        example: '+1234567890',
        description: 'Candidate phone number',
    })
    phone?: string | null;

    @ApiPropertyOptional({
        example: 'Software Engineer',
        description: 'Position the candidate is applying for',
    })
    position?: string | null;

    @ApiPropertyOptional({
        example: 'Great communication skills',
        description: 'Additional notes about the candidate',
    })
    notes?: string | null;
}

export class UpdateCandidateDto {
    @ApiPropertyOptional({ example: 'John' })
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe' })
    lastName?: string;

    @ApiPropertyOptional({ example: 'john.doe@example.com' })
    email?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    phone?: string | null;

    @ApiPropertyOptional({ example: 'Senior Software Engineer' })
    position?: string | null;

    @ApiPropertyOptional({ example: 'Updated notes' })
    notes?: string | null;
}

export class TransitionStateDto {
    @ApiProperty({
        example: 'INTERVIEW',
        description: 'Target state for the transition',
        enum: ['NEW', 'PRESCREENED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'],
    })
    toState: string;

    @ApiPropertyOptional({
        example: 'Passed initial screening, scheduling interview',
        description: 'Notes explaining the transition',
    })
    notes?: string | null;
}

export class ListCandidatesQueryDto {
    @ApiPropertyOptional({
        example: 'NEW',
        description: 'Filter by candidate state',
        enum: ['NEW', 'PRESCREENED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'],
    })
    state?: string;

    @ApiPropertyOptional({
        example: 'john',
        description: 'Search by name or email',
    })
    search?: string;

    @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
    page?: number;

    @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
    limit?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class CandidateResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'John' })
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    email: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    phone: string | null;

    @ApiProperty({ example: 'NEW', enum: ['NEW', 'PRESCREENED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'] })
    state: string;

    @ApiPropertyOptional({ example: 'Software Engineer' })
    position: string | null;

    @ApiPropertyOptional({ example: 'Great candidate' })
    notes: string | null;

    @ApiProperty({ example: 1, description: 'Organization ID (tenant)' })
    organizationId: number;

    @ApiProperty({ example: '2026-01-05T10:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-01-05T10:00:00.000Z' })
    updatedAt: Date;
}

export class CandidateListResponseDto {
    @ApiProperty({ type: [CandidateResponseDto] })
    data: CandidateResponseDto[];

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;
}

export class StateHistoryResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'NEW' })
    fromState: string;

    @ApiProperty({ example: 'PRESCREENED' })
    toState: string;

    @ApiPropertyOptional({ example: 'Passed resume review' })
    notes: string | null;

    @ApiProperty({ example: '2026-01-05T10:00:00.000Z' })
    changedAt: Date;

    @ApiProperty({ example: 1 })
    changedById: number;
}
