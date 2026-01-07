import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Candidate, CandidateState } from './candidate.entity';
import { User } from '../../users/entities/user.entity';

/**
 * State History Entity
 *
 * Tracks all state transitions for candidates.
 * Provides complete audit trail: WHO changed WHAT, WHEN, and WHY.
 *
 * WHY SEPARATE TABLE INSTEAD OF JSON COLUMN?
 * - Queryable: Easy to find all actions by a user
 * - Indexable: Fast lookup by candidate, date range, or user
 * - Relational integrity: Foreign keys to candidates and users
 *
 * ALTERNATIVE: PostgreSQL JSONB column with state history array
 * - Simpler schema but harder to query across candidates
 * - No referential integrity for user IDs
 */
@Entity('state_history')
export class StateHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Candidate, (candidate) => candidate.stateHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column()
  candidateId: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  fromState: CandidateState;

  @Column({
    type: 'varchar',
    length: 20,
  })
  toState: CandidateState;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'changedById' })
  changedBy: User;

  @Column()
  changedById: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  changedAt: Date;
}
