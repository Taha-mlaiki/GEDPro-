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
    UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CandidateService } from './candidate.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TenancyInterceptor } from '../../common/interceptors/tenancy.interceptor';
import {
    CreateCandidateSchema,
    type CreateCandidateDTO,
    UpdateCandidateSchema,
    type UpdateCandidateDTO,
    TransitionStateSchema,
    type TransitionStateDTO,
    ListCandidatesQuerySchema,
    type ListCandidatesQueryDTO,
} from './schemas/candidate.schema';

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
    CreateCandidateDto,
    UpdateCandidateDto,
    TransitionStateDto,
    ListCandidatesQueryDto,
    CandidateResponseDto,
    CandidateListResponseDto,
    StateHistoryResponseDto,
} from './dtos/candidate-swagger.dto';

/**
 * Candidate Controller
 *
 * All endpoints are:
 * - Protected by JWT authentication
 * - Scoped to the current tenant via TenancyInterceptor
 * - Validated with Zod schemas
 */
@ApiTags('Candidates')
@ApiBearerAuth('access-token')
@Controller('candidates')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenancyInterceptor)
export class CandidateController {
    constructor(private readonly candidateService: CandidateService) { }

    /**
     * Create a new candidate
     * POST /candidates
     */
    @Post()
    @ApiOperation({
        summary: 'Create a new candidate',
        description: 'Creates a new candidate in the current tenant. Initial state is NEW.',
    })
    @ApiBody({ type: CreateCandidateDto })
    @ApiResponse({ status: 201, description: 'Candidate created', type: CandidateResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error or duplicate email' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    create(
        @Body(new ZodValidationPipe(CreateCandidateSchema))
        dto: CreateCandidateDTO,
    ) {
        return this.candidateService.create(dto);
    }

    /**
     * List candidates with pagination and filtering
     * GET /candidates?state=NEW&search=john&page=1&limit=20
     */
    @Get()
    @ApiOperation({
        summary: 'List candidates',
        description: 'Returns paginated list of candidates for the current tenant.',
    })
    @ApiQuery({ type: ListCandidatesQueryDto })
    @ApiResponse({ status: 200, description: 'Candidate list', type: CandidateListResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll(
        @Query(new ZodValidationPipe(ListCandidatesQuerySchema))
        query: ListCandidatesQueryDTO,
    ) {
        return this.candidateService.findAll(query);
    }

    /**
     * Get a single candidate by ID
     * GET /candidates/:id
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Get candidate by ID',
        description: 'Returns a single candidate with state history.',
    })
    @ApiParam({ name: 'id', type: 'number', example: 1 })
    @ApiResponse({ status: 200, description: 'Candidate found', type: CandidateResponseDto })
    @ApiResponse({ status: 404, description: 'Candidate not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.candidateService.findById(id);
    }

    /**
     * Update candidate details
     * PATCH /candidates/:id
     */
    @Patch(':id')
    @ApiOperation({
        summary: 'Update candidate',
        description: 'Updates candidate details. Does not change state.',
    })
    @ApiParam({ name: 'id', type: 'number', example: 1 })
    @ApiBody({ type: UpdateCandidateDto })
    @ApiResponse({ status: 200, description: 'Candidate updated', type: CandidateResponseDto })
    @ApiResponse({ status: 404, description: 'Candidate not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ZodValidationPipe(UpdateCandidateSchema))
        dto: UpdateCandidateDTO,
    ) {
        return this.candidateService.update(id, dto);
    }

    /**
     * Transition candidate state
     * PATCH /candidates/:id/state
     */
    @Patch(':id/state')
    @ApiOperation({
        summary: 'Transition candidate state',
        description: `
Changes the candidate's workflow state.

**Valid transitions:**
- NEW → PRESCREENED, REJECTED
- PRESCREENED → INTERVIEW, REJECTED
- INTERVIEW → OFFER, REJECTED
- OFFER → HIRED, REJECTED
- HIRED → (terminal)
- REJECTED → (terminal)
    `,
    })
    @ApiParam({ name: 'id', type: 'number', example: 1 })
    @ApiBody({ type: TransitionStateDto })
    @ApiResponse({ status: 200, description: 'State transitioned', type: CandidateResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid state transition' })
    @ApiResponse({ status: 404, description: 'Candidate not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    transitionState(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ZodValidationPipe(TransitionStateSchema))
        dto: TransitionStateDTO,
    ) {
        return this.candidateService.transitionState(id, dto);
    }

    /**
     * Get state history for a candidate
     * GET /candidates/:id/history
     */
    @Get(':id/history')
    @ApiOperation({
        summary: 'Get candidate state history',
        description: 'Returns the complete audit trail of state transitions.',
    })
    @ApiParam({ name: 'id', type: 'number', example: 1 })
    @ApiResponse({ status: 200, description: 'State history', type: [StateHistoryResponseDto] })
    @ApiResponse({ status: 404, description: 'Candidate not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getHistory(@Param('id', ParseIntPipe) id: number) {
        return this.candidateService.getStateHistory(id);
    }

    /**
     * Delete a candidate
     * DELETE /candidates/:id
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Delete candidate',
        description: 'Deletes a candidate. Cannot delete HIRED candidates.',
    })
    @ApiParam({ name: 'id', type: 'number', example: 1 })
    @ApiResponse({ status: 200, description: 'Candidate deleted' })
    @ApiResponse({ status: 403, description: 'Cannot delete hired candidates' })
    @ApiResponse({ status: 404, description: 'Candidate not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.candidateService.delete(id);
    }
}
