import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { StateHistory } from './state-history.entity';
import { Organization } from '../../organization/entities/organization.entity';

/**
 * Candidate State Enum
 *
 * Represents the hiring workflow states.
 *
 * STATE MACHINE TRANSITIONS:
 * NEW -> PRESCREENED -> INTERVIEW -> OFFER -> HIRED
 *                    |           |
 *                    +-> REJECTED <-+
 *
 * Any state can transition to REJECTED (except HIRED)
 */
export enum CandidateState {
  NEW = 'NEW',
  PRESCREENED = 'PRESCREENED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

/**
 * Valid state transitions map
 * Used by service to validate transitions
 */
export const VALID_STATE_TRANSITIONS: Record<CandidateState, CandidateState[]> =
{
  [CandidateState.NEW]: [CandidateState.PRESCREENED, CandidateState.REJECTED],
  [CandidateState.PRESCREENED]: [
    CandidateState.INTERVIEW,
    CandidateState.REJECTED,
  ],
  [CandidateState.INTERVIEW]: [CandidateState.OFFER, CandidateState.REJECTED],
  [CandidateState.OFFER]: [CandidateState.HIRED, CandidateState.REJECTED],
  [CandidateState.HIRED]: [], // Terminal state
  [CandidateState.REJECTED]: [], // Terminal state
};

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: CandidateState.NEW,
  })
  state: CandidateState;

  @Column({ type: 'varchar', nullable: true })
  position: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  resumeUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Multi-tenancy: Each candidate belongs to one organization
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: number;

  // State history for audit trail
  @OneToMany(() => StateHistory, (history) => history.candidate)
  stateHistory: StateHistory[];
}
