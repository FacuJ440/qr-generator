import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { QrStaticContentEntity } from './qr-static-content.entity';
import { QrDynamicContentEntity } from './qr-dynamic-content.entity';
import { TagEntity } from '../tags/tag.entity';

export enum QrType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
}

export enum QrCategory {
  URL = 'url',
  TEXT = 'text',
  WIFI = 'wifi',
  VCARD = 'vcard',
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
}

export enum QrStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
}

export enum QrEyeShape {
  SQUARE = 'square',
  ROUNDED = 'rounded',
  CIRCLE = 'circle',
}

export enum QrErrorCorrectionLevel {
  L = 'L',
  M = 'M',
  Q = 'Q',
  H = 'H',
}

export interface QrStyleConfig {
  foregroundColor: string;
  backgroundColor: string;
  logoUrl?: string;
  eyeShape: QrEyeShape;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  margin: number;
  width: number;
}

@Entity('qr_codes')
export class QrCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId!: string | null;

  @Column({ type: 'enum', enum: QrType })
  type!: QrType;

  @Column({ type: 'enum', enum: QrCategory })
  category!: QrCategory;

  @Column()
  title!: string;

  @Column({ name: 'tag_id', type: 'uuid', nullable: true })
  @Index()
  tagId!: string | null;

  @Column({ name: 'style_config', type: 'jsonb', default: '{}' })
  styleConfig!: QrStyleConfig;

  @Column({ type: 'enum', enum: QrStatus, default: QrStatus.ACTIVE })
  status!: QrStatus;

  @Column({ name: 'is_archived', type: 'boolean', default: false })
  isArchived!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // User relation removed — auth is disabled, all QR codes are public

  @OneToOne(() => QrStaticContentEntity, (sc) => sc.qrCode, {
    nullable: true,
    cascade: true,
  })
  staticContent!: QrStaticContentEntity | null;

  @OneToOne(() => QrDynamicContentEntity, (dc) => dc.qrCode, {
    nullable: true,
    cascade: true,
  })
  dynamicContent!: QrDynamicContentEntity | null;

  @ManyToOne(() => TagEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'tag_id' })
  tag!: TagEntity | null;
}
