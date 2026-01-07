import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { StateHistory } from './entities/state-history.entity';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { TenantContextService } from '../../common/services/tenant-context.service';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate, StateHistory])],
  controllers: [CandidateController],
  providers: [CandidateService, TenantContextService],
  exports: [CandidateService],
})
export class CandidateModule {}
