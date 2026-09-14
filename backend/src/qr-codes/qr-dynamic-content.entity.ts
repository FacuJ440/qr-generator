import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { QrCodeEntity } from './qr-code.entity';

@Entity('qr_dynamic_content')
export class QrDynamicContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'qr_code_id', type: 'uuid', unique: true })
  qrCodeId!: string;

  @Column({ name: 'short_code', unique: true })
  @Index()
  shortCode!: string;

  @Column({ name: 'target_url', type: 'text' })
  targetUrl!: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'scan_count', type: 'bigint', default: 0 })
  scanCount!: number;

  @OneToOne(() => QrCodeEntity, (qr) => qr.dynamicContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'qr_code_id' })
  qrCode!: QrCodeEntity;
}
