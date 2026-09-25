import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WebtreePageEntity } from './webtree-page.entity';

@Entity('webtree_links')
export class WebtreeLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'page_id', type: 'uuid' })
  @Index()
  pageId!: string;

  @Column()
  label!: string;

  @Column()
  url!: string;

  @Column({ type: 'varchar', nullable: true })
  icon!: string | null;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => WebtreePageEntity, (page) => page.links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'page_id' })
  page!: WebtreePageEntity;
}
