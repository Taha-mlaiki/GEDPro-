import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationService } from './organization.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateOrganizationSchema,
  type CreateOrganizationDTO,
  UpdateOrganizationSchema,
  type UpdateOrganizationDTO,
  ListOrganizationsQuerySchema,
  type ListOrganizationsQueryDTO,
} from './schemas/organization.schema';

// Swagger imports
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  ListOrganizationsQueryDto,
  OrganizationResponseDto,
  OrganizationListResponseDto,
} from './dtos/organization-swagger.dto';

/**
 * Organization Controller
 *
 * All endpoints are protected by JWT authentication.
 * Validated with Zod schemas.
 */
@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@Controller('organization')
@UseGuards(AuthGuard('jwt'))
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  /**
   * Create a new organization
   * POST /organization
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new organization',
    description: 'Creates a new tenant/organization in the system.',
  })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({ status: 201, description: 'Organization created', type: OrganizationResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate slug' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body(new ZodValidationPipe(CreateOrganizationSchema))
    dto: CreateOrganizationDTO,
  ) {
    return this.organizationService.create(dto);
  }

  /**
   * List organizations with pagination and filtering
   * GET /organization?search=acme&isActive=true&page=1&limit=20
   */
  @Get()
  @ApiOperation({
    summary: 'List organizations',
    description: 'Returns paginated list of organizations. Supports filtering by name and active status.',
  })
  @ApiQuery({ type: ListOrganizationsQueryDto })
  @ApiResponse({ status: 200, description: 'Organization list', type: OrganizationListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query(new ZodValidationPipe(ListOrganizationsQuerySchema))
    query: ListOrganizationsQueryDTO,
  ) {
    return this.organizationService.findAll(query);
  }

  /**
   * Get a single organization by ID
   * GET /organization/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get organization by ID',
    description: 'Returns a single organization by its ID.',
  })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ status: 200, description: 'Organization found', type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findById(id);
  }

  /**
   * Update organization details
   * PATCH /organization/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update organization',
    description: 'Updates organization details. All fields are optional.',
  })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({ status: 200, description: 'Organization updated', type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateOrganizationSchema))
    dto: UpdateOrganizationDTO,
  ) {
    return this.organizationService.update(id, dto);
  }

  /**
   * Delete an organization
   * DELETE /organization/:id
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete organization',
    description: 'Deletes an organization. Will fail if organization has active users or candidates.',
  })
  @ApiParam({ name: 'id', type: 'number', example: 1 })
  @ApiResponse({ status: 200, description: 'Organization deleted' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.delete(id);
  }
}
