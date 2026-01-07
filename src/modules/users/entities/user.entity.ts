import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  role: Role;

  @ManyToOne(() => Organization, (org) => org.users, { eager: true })
  organization: Organization;
}
