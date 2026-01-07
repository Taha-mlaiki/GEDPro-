/**
 * Swagger DTOs for Organizations Module
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// REQUEST DTOs
// ============================================

export class CreateOrganizationDto {
    @ApiProperty({
        example: 'Acme Corporation',
        description: 'Organization name',
        minLength: 2,
        maxLength: 100,
    })
    name: string;

    @ApiProperty({
        example: 'acme-corp',
        description: 'URL-friendly slug (lowercase, hyphens only)',
        pattern: '^[a-z0-9-]+$',
    })
    slug: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the organization is active',
        default: true,
    })
    isActive?: boolean;
}

export class UpdateOrganizationDto {
    @ApiPropertyOptional({ example: 'Acme Inc' })
    name?: string;

    @ApiPropertyOptional({ example: 'acme-inc' })
    slug?: string;

    @ApiPropertyOptional({ example: false })
    isActive?: boolean;
}

export class ListOrganizationsQueryDto {
    @ApiPropertyOptional({
        example: 'acme',
        description: 'Search by organization name',
    })
    search?: string;

    @ApiPropertyOptional({
        example: 'true',
        description: 'Filter by active status',
        enum: ['true', 'false'],
    })
    isActive?: string;

    @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
    page?: number;

    @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
    limit?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class OrganizationResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Acme Corporation' })
    name: string;

    @ApiProperty({ example: 'acme-corp' })
    slug: string;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ example: '2026-01-05T10:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-01-05T10:00:00.000Z' })
    updatedAt: Date;
}

export class OrganizationListResponseDto {
    @ApiProperty({ type: [OrganizationResponseDto] })
    data: OrganizationResponseDto[];

    @ApiProperty({ example: 50 })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;
}
