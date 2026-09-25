import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { QrCodeEntity } from '../qr-codes/qr-code.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  email!: string;

  @Column()
  name!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ default: 'free' })
  plan!: string;

  @Column({ type: 'varchar', default: UserRole.USER })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => QrCodeEntity, (qr) => qr.user)
  qrCodes!: QrCodeEntity[];
}
