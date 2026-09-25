import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebtreePageEntity } from './webtree-page.entity';
import { WebtreeLinkEntity } from './webtree-link.entity';
import { CreateWebtreePageDto, UpdateWebtreePageDto } from './dto/webtree.dto';
import * as crypto from 'crypto';

@Injectable()
export class WebtreeService {
  constructor(
    @InjectRepository(WebtreePageEntity)
    private readonly pageRepo: Repository<WebtreePageEntity>,
    @InjectRepository(WebtreeLinkEntity)
    private readonly linkRepo: Repository<WebtreeLinkEntity>,
  ) {}

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${base || 'page'}-${suffix}`;
  }

  async create(dto: CreateWebtreePageDto, userId: string): Promise<WebtreePageEntity> {
    let slug = dto.slug || this.generateSlug(dto.title);

    // Ensure slug is unique
    const existing = await this.pageRepo.findOne({ where: { slug } });
    if (existing) {
      slug = this.generateSlug(dto.title);
    }

    const page = this.pageRepo.create({
      userId,
      slug,
      title: dto.title,
      description: dto.description || null,
      bio: dto.bio || null,
      avatarUrl: dto.avatarUrl || null,
      themeColor: dto.themeColor || '#16a34a',
      backgroundColor: dto.backgroundColor || '#ffffff',
      textColor: dto.textColor || '#1f2937',
      links: (dto.links || []).map((l, i) =>
        this.linkRepo.create({
          label: l.label,
          url: l.url,
          icon: l.icon || null,
          order: l.order ?? i,
          isActive: l.isActive ?? true,
        }),
      ),
    });

    return this.pageRepo.save(page);
  }

  async findAll(userId: string): Promise<WebtreePageEntity[]> {
    return this.pageRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<WebtreePageEntity> {
    const page = await this.pageRepo.findOne({
      where: { id, userId },
      relations: ['links'],
    });
    if (!page) throw new NotFoundException('Página no encontrada');
    return page;
  }

  async findBySlug(slug: string): Promise<WebtreePageEntity> {
    const page = await this.pageRepo.findOne({
      where: { slug, isActive: true },
      relations: ['links'],
    });
    if (!page) throw new NotFoundException('Página no encontrada');
    return page;
  }

  async update(id: string, dto: UpdateWebtreePageDto, userId: string): Promise<WebtreePageEntity> {
    const page = await this.findOne(id, userId);

    // Update basic fields
    if (dto.title !== undefined) page.title = dto.title;
    if (dto.description !== undefined) page.description = dto.description;
    if (dto.bio !== undefined) page.bio = dto.bio;
    if (dto.avatarUrl !== undefined) page.avatarUrl = dto.avatarUrl;
    if (dto.themeColor !== undefined) page.themeColor = dto.themeColor;
    if (dto.backgroundColor !== undefined) page.backgroundColor = dto.backgroundColor;
    if (dto.textColor !== undefined) page.textColor = dto.textColor;
    if (dto.isActive !== undefined) page.isActive = dto.isActive;

    if (dto.slug !== undefined && dto.slug !== page.slug) {
      const existing = await this.pageRepo.findOne({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new BadRequestException('El slug ya está en uso');
      }
      page.slug = dto.slug;
    }

    // Update links if provided (full replace strategy)
    if (dto.links !== undefined) {
      // Remove existing links
      await this.linkRepo.delete({ pageId: id });

      // Create new links
      page.links = dto.links.map((l, i) =>
        this.linkRepo.create({
          pageId: id,
          label: l.label,
          url: l.url,
          icon: l.icon || null,
          order: l.order ?? i,
          isActive: l.isActive ?? true,
        }),
      );
    }

    return this.pageRepo.save(page);
  }

  async delete(id: string, userId: string): Promise<void> {
    const page = await this.findOne(id, userId);
    await this.pageRepo.remove(page);
  }

  async addLink(pageId: string, linkData: { label: string; url: string; icon?: string }, userId: string): Promise<WebtreeLinkEntity> {
    const page = await this.findOne(pageId, userId);
    const count = await this.linkRepo.count({ where: { pageId } });
    const link = this.linkRepo.create({
      pageId,
      label: linkData.label,
      url: linkData.url,
      icon: linkData.icon || null,
      order: count,
    });
    return this.linkRepo.save(link);
  }

  async updateLink(pageId: string, linkId: string, dto: Partial<WebtreeLinkEntity>, userId: string): Promise<WebtreeLinkEntity> {
    await this.findOne(pageId, userId);
    const link = await this.linkRepo.findOne({ where: { id: linkId, pageId } });
    if (!link) throw new NotFoundException('Enlace no encontrado');

    if (dto.label !== undefined) link.label = dto.label;
    if (dto.url !== undefined) link.url = dto.url;
    if (dto.icon !== undefined) link.icon = dto.icon;
    if (dto.order !== undefined) link.order = dto.order;
    if (dto.isActive !== undefined) link.isActive = dto.isActive;

    return this.linkRepo.save(link);
  }

  async deleteLink(pageId: string, linkId: string, userId: string): Promise<void> {
    await this.findOne(pageId, userId);
    const link = await this.linkRepo.findOne({ where: { id: linkId, pageId } });
    if (!link) throw new NotFoundException('Enlace no encontrado');
    await this.linkRepo.remove(link);
  }
}
