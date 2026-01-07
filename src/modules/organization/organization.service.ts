import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Organization } from './entities/organization.entity';
import {
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
  ListOrganizationsQueryDTO,
} from './schemas/organization.schema';

/**
 * Organization Service
 *
 * Handles all organization CRUD operations with TypeORM.
 */
@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  /**
   * Create a new organization
   */
  async create(dto: CreateOrganizationDTO): Promise<Organization> {
    // Check for duplicate slug
    const existing = await this.organizationRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException(
        'Organization with this slug already exists',
      );
    }

    const organization = this.organizationRepo.create(dto);
    return this.organizationRepo.save(organization);
  }

  /**
   * Find all organizations with pagination
   */
  async findAll(query: ListOrganizationsQueryDTO): Promise<{
    data: Organization[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, isActive, page, limit } = query;

    const where: FindOptionsWhere<Organization> = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.name = Like(`%${search}%`);
    }

    const [data, total] = await this.organizationRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
  }

  /**
   * Find a single organization by ID
   */
  async findById(id: number): Promise<Organization> {
    const organization = await this.organizationRepo.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Update organization details
   */
  async update(id: number, dto: UpdateOrganizationDTO): Promise<Organization> {
    const organization = await this.findById(id);

    // If slug is being changed, check for duplicates
    if (dto.slug && dto.slug !== organization.slug) {
      const existing = await this.organizationRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new BadRequestException(
          'Slug already in use by another organization',
        );
      }
    }

    Object.assign(organization, dto);
    return this.organizationRepo.save(organization);
  }

  /**
   * Delete an organization
   */
  async delete(id: number): Promise<void> {
    const organization = await this.findById(id);
    await this.organizationRepo.remove(organization);
  }
}
