import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { WebtreeLinkEntity } from './webtree-link.entity';

@Entity('webtree_pages')
export class WebtreePageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ unique: true })
  @Index()
  slug!: string;

  @Column()
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  bio!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'theme_color', default: '#16a34a' })
  themeColor!: string;

  @Column({ name: 'background_color', default: '#ffffff' })
  backgroundColor!: string;

  @Column({ name: 'text_color', default: '#1f2937' })
  textColor!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @OneToMany(() => WebtreeLinkEntity, (link) => link.page, {
    cascade: true,
    eager: true,
  })
  links!: WebtreeLinkEntity[];
}
