import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { QrCodeEntity } from './qr-code.entity';

@Entity('qr_static_content')
export class QrStaticContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'qr_code_id', type: 'uuid', unique: true })
  qrCodeId!: string;

  @Column({ type: 'jsonb' })
  content!: Record<string, unknown>;

  @OneToOne(() => QrCodeEntity, (qr) => qr.staticContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'qr_code_id' })
  qrCode!: QrCodeEntity;
}
