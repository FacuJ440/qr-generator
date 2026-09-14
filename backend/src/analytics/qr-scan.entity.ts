import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { QrCodeEntity } from '../qr-codes/qr-code.entity';

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  UNKNOWN = 'unknown',
}

@Entity('qr_scans')
export class QrScanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'qr_code_id', type: 'uuid' })
  @Index()
  qrCodeId!: string;

  @Column({ name: 'scanned_at', type: 'timestamptz' })
  @Index()
  scannedAt!: Date;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'device_type', type: 'enum', enum: DeviceType, default: DeviceType.UNKNOWN })
  deviceType!: DeviceType;

  @Column({ type: 'varchar', nullable: true })
  browser!: string | null;

  @Column({ type: 'varchar', nullable: true })
  os!: string | null;

  @Column({ type: 'varchar', nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'text', nullable: true })
  referrer!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => QrCodeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'qr_code_id' })
  qrCode!: QrCodeEntity;
}
