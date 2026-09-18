import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from './tag.entity';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

const DEFAULT_TAGS: { text: string; color: string }[] = [
  { text: 'Plazas y parques', color: '#22c55e' },
  { text: 'Movilidad', color: '#3b82f6' },
  { text: 'Patrimonio', color: '#d4af37' },
  { text: 'Paseos peatonales', color: '#f97316' },
  { text: 'Gestión municipal', color: '#8b5cf6' },
  { text: 'Cultura', color: '#9f1239' },
];

@Injectable()
export class TagsService implements OnModuleInit {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.tagRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding default tags...');
    await this.tagRepo.save(
      DEFAULT_TAGS.map((t) => this.tagRepo.create({ text: t.text, color: t.color })),
    );
    this.logger.log(`Seeded ${DEFAULT_TAGS.length} default tags.`);
  }

  async findAll(): Promise<TagEntity[]> {
    return this.tagRepo.find({ order: { createdAt: 'ASC' } });
  }

  async create(dto: CreateTagDto): Promise<TagEntity> {
    const tag = this.tagRepo.create({ text: dto.text, color: dto.color });
    return this.tagRepo.save(tag);
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagEntity> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    if (dto.text !== undefined) tag.text = dto.text;
    if (dto.color !== undefined) tag.color = dto.color;
    return this.tagRepo.save(tag);
  }

  async delete(id: string): Promise<void> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.tagRepo.remove(tag);
  }
}
