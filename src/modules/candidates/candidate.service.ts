import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import {
  Candidate,
  CandidateState,
  VALID_STATE_TRANSITIONS,
} from './entities/candidate.entity';
import { StateHistory } from './entities/state-history.entity';
import { TenantContextService } from '../../common/services/tenant-context.service';
import {
  CreateCandidateDTO,
  UpdateCandidateDTO,
  TransitionStateDTO,
  ListCandidatesQueryDTO,
} from './schemas/candidate.schema';

/**
 * Candidate Service
 *
 * Handles all candidate CRUD operations with multi-tenant isolation.
 * Implements state machine logic with full audit trail.
 *
 * TENANT ISOLATION:
 * All queries automatically filtered by organizationId from TenantContext.
 * This ensures "Company A" cannot access "Company B" candidates.
 */
@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    @InjectRepository(StateHistory)
    private readonly historyRepo: Repository<StateHistory>,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Create a new candidate (scoped to current tenant)
   */
  async create(dto: CreateCandidateDTO): Promise<Candidate> {
    const organizationId = this.tenantContext.getOrganizationId();

    // Check for duplicate email within the organization
    const existing = await this.candidateRepo.findOne({
      where: { email: dto.email, organizationId },
    });
    if (existing) {
      throw new BadRequestException('Candidate with this email already exists');
    }

    const candidate = this.candidateRepo.create({
      ...dto,
      organizationId,
      state: CandidateState.NEW,
    });

    const saved = await this.candidateRepo.save(candidate);

    // Log initial state
    await this.logStateChange(
      saved.id,
      CandidateState.NEW,
      CandidateState.NEW,
      'Candidate created',
    );

    return saved;
  }

  /**
   * Find all candidates for the current tenant with pagination
   */
  async findAll(query: ListCandidatesQueryDTO): Promise<{
    data: Candidate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const organizationId = this.tenantContext.getOrganizationId();
    const { state, search, page, limit } = query;

    const where: FindOptionsWhere<Candidate> = { organizationId };
    if (state) where.state = state;
    if (search) {
      // Simple search on name and email
      where.email = Like(`%${search}%`);
    }

    const [data, total] = await this.candidateRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
  }

  /**
   * Find a single candidate by ID (tenant-scoped)
   */
  async findById(id: number): Promise<Candidate> {
    const organizationId = this.tenantContext.getOrganizationId();

    const candidate = await this.candidateRepo.findOne({
      where: { id, organizationId },
      relations: ['stateHistory'],
    });

    if (!candidate) {
      // Don't expose whether candidate exists in another tenant
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }

  /**
   * Update candidate details (tenant-scoped)
   */
  async update(id: number, dto: UpdateCandidateDTO): Promise<Candidate> {
    const candidate = await this.findById(id);

    // If email is being changed, check for duplicates
    if (dto.email && dto.email !== candidate.email) {
      const organizationId = this.tenantContext.getOrganizationId();
      const existing = await this.candidateRepo.findOne({
        where: { email: dto.email, organizationId },
      });
      if (existing) {
        throw new BadRequestException(
          'Email already in use by another candidate',
        );
      }
    }

    Object.assign(candidate, dto);
    return this.candidateRepo.save(candidate);
  }

  /**
   * Transition candidate state with validation and audit logging
   *
   * STATE MACHINE RULES:
   * - Only valid transitions allowed (see VALID_STATE_TRANSITIONS)
   * - Terminal states (HIRED, REJECTED) cannot be changed
   * - Every transition is logged to StateHistory
   */
  async transitionState(
    id: number,
    dto: TransitionStateDTO,
  ): Promise<Candidate> {
    const candidate = await this.findById(id);
    const { toState, notes } = dto;

    // Validate transition
    const validTransitions = VALID_STATE_TRANSITIONS[candidate.state];
    if (!validTransitions.includes(toState)) {
      throw new BadRequestException(
        `Cannot transition from ${candidate.state} to ${toState}. ` +
          `Valid transitions: ${validTransitions.join(', ') || 'none (terminal state)'}`,
      );
    }

    const fromState = candidate.state;
    candidate.state = toState;

    await this.candidateRepo.save(candidate);
    await this.logStateChange(id, fromState, toState, notes ?? null);

    return candidate;
  }

  /**
   * Get state history for a candidate
   */
  async getStateHistory(candidateId: number): Promise<StateHistory[]> {
    // First verify candidate belongs to tenant
    await this.findById(candidateId);

    return this.historyRepo.find({
      where: { candidateId },
      relations: ['changedBy'],
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Delete a candidate (soft delete could be implemented here)
   */
  async delete(id: number): Promise<void> {
    const candidate = await this.findById(id);

    // Prevent deletion of hired candidates
    if (candidate.state === CandidateState.HIRED) {
      throw new ForbiddenException('Cannot delete hired candidates');
    }

    await this.candidateRepo.remove(candidate);
  }

  /**
   * Log state change to history table
   */
  private async logStateChange(
    candidateId: number,
    fromState: CandidateState,
    toState: CandidateState,
    notes: string | null,
  ): Promise<void> {
    const userId = this.tenantContext.getUserId();

    const history = this.historyRepo.create({
      candidateId,
      fromState,
      toState,
      changedById: userId,
      notes,
    });

    await this.historyRepo.save(history);
  }
}
