import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from './tag.entity';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
  ) {}

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
