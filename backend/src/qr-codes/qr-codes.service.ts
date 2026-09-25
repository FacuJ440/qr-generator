import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import {
  QrCodeEntity,
  QrType,
  QrCategory,
  QrStatus,
  QrEyeShape,
  QrErrorCorrectionLevel,
  QrStyleConfig,
} from './qr-code.entity';
import { QrStaticContentEntity } from './qr-static-content.entity';
import { QrDynamicContentEntity } from './qr-dynamic-content.entity';
import { CreateQrCodeDto, UpdateQrCodeDto, QrCodeFilterDto } from './dto/qr-code.dto';

const DEFAULT_STYLE: QrStyleConfig = {
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
  eyeShape: QrEyeShape.SQUARE,
  errorCorrectionLevel: QrErrorCorrectionLevel.M,
  margin: 2,
  width: 300,
};

@Injectable()
export class QrCodesService {
  constructor(
    @InjectRepository(QrCodeEntity)
    private readonly qrRepo: Repository<QrCodeEntity>,
    @InjectRepository(QrStaticContentEntity)
    private readonly staticRepo: Repository<QrStaticContentEntity>,
    @InjectRepository(QrDynamicContentEntity)
    private readonly dynamicRepo: Repository<QrDynamicContentEntity>,
    private readonly configService: ConfigService,
  ) {}

  // ---------- Create ----------
  async create(dto: CreateQrCodeDto, userId: string): Promise<QrCodeEntity> {
    const styleConfig: QrStyleConfig = { ...DEFAULT_STYLE, ...dto.styleConfig };
    const qr = this.qrRepo.create({
      type: dto.type,
      category: dto.category,
      title: dto.title,
      userId,
      tagId: dto.tagId ?? null,
      styleConfig,
      status: QrStatus.ACTIVE,
    });

    if (dto.type === QrType.STATIC) {
      if (!dto.content) throw new BadRequestException('Content is required for static QR');
      const staticContent = this.staticRepo.create({ content: dto.content });
      qr.staticContent = staticContent;
    } else {
      if (!dto.targetUrl) throw new BadRequestException('targetUrl is required for dynamic QR');
      this.validateUrl(dto.targetUrl);
      const shortCode = await this.generateUniqueShortCode();
      const dynamicContent = this.dynamicRepo.create({
        shortCode,
        targetUrl: dto.targetUrl,
        expiresAt: dto.expiresAt ?? null,
        scanCount: 0,
      });
      qr.dynamicContent = dynamicContent;
    }

    return this.qrRepo.save(qr);
  }

  // ---------- Read ----------
  async findAll(filters: QrCodeFilterDto, userId: string): Promise<{ items: QrCodeEntity[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<QrCodeEntity> = {
      isArchived: false,
      userId,
    };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.search) where.title = ILike(`%${filters.search}%`);
    if (filters.tagId) where.tagId = filters.tagId;

    const qb = this.qrRepo
      .createQueryBuilder('qr')
      .where(where)
      .leftJoinAndSelect('qr.staticContent', 'sc')
      .leftJoinAndSelect('qr.dynamicContent', 'dc')
      .leftJoinAndSelect('qr.tag', 'tag')
      .skip(skip)
      .take(limit);

    if (filters.sortByScans) {
      qb.orderBy('dc.scan_count', 'DESC');
    } else {
      qb.orderBy('qr.createdAt', 'DESC');
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, userId?: string): Promise<QrCodeEntity> {
    const qr = await this.qrRepo.findOne({
      where: { id },
      relations: ['staticContent', 'dynamicContent', 'tag'],
    });
    if (!qr) throw new NotFoundException('QR code not found');
    if (userId && qr.userId !== userId) throw new ForbiddenException('Access denied');
    return qr;
  }

  // ---------- Update ----------
  async update(id: string, dto: UpdateQrCodeDto, userId: string): Promise<QrCodeEntity> {
    const qr = await this.findOne(id, userId);

    if (dto.title !== undefined) qr.title = dto.title;
    if (dto.tagId !== undefined) qr.tagId = dto.tagId || null;
    if (dto.styleConfig) qr.styleConfig = { ...qr.styleConfig, ...dto.styleConfig };
    if (dto.status !== undefined) qr.status = dto.status;

    if (dto.targetUrl !== undefined) {
      if (qr.type !== QrType.DYNAMIC) {
        throw new BadRequestException('Cannot set targetUrl on a static QR');
      }
      this.validateUrl(dto.targetUrl);
      if (qr.dynamicContent) qr.dynamicContent.targetUrl = dto.targetUrl;
    }

    if (dto.expiresAt !== undefined && qr.dynamicContent) {
      qr.dynamicContent.expiresAt = dto.expiresAt;
    }

    return this.qrRepo.save(qr);
  }

  // ---------- Delete / Archive ----------
  async delete(id: string, userId: string): Promise<void> {
    const qr = await this.findOne(id, userId);
    await this.qrRepo.remove(qr);
  }

  async archive(id: string, userId: string): Promise<QrCodeEntity> {
    const qr = await this.findOne(id, userId);
    qr.isArchived = true;
    qr.status = QrStatus.ARCHIVED;
    return this.qrRepo.save(qr);
  }

  // ---------- QR Image Generation ----------
  async generateImage(
    id: string,
    format: 'png' | 'svg' = 'png',
  ): Promise<Buffer> {
    const qr = await this.findOne(id);
    const encodedContent = this.getEncodedContent(qr);
    const style = qr.styleConfig;

    const width = style.width ?? 300;
    const fgColor = style.foregroundColor ?? '#000000';
    const bgColor = style.backgroundColor ?? '#FFFFFF';
    const errorLevel = (style.errorCorrectionLevel ?? QrErrorCorrectionLevel.M) as 'L' | 'M' | 'Q' | 'H';
    const margin = style.margin ?? 2;

    // Use the 'qrcode' library which works in Node.js (qr-code-styling is browser-only)
    const qrOptions: QRCode.QRCodeRenderersOptions = {
      errorCorrectionLevel: errorLevel,
      margin,
      width,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    };

    if (format === 'svg') {
      const svgString = await QRCode.toString(encodedContent || 'https://example.com', {
        ...qrOptions,
        type: 'svg',
      });
      return Buffer.from(svgString, 'utf-8');
    }

    // PNG: generate directly with qrcode library
    const pngBuffer = await QRCode.toBuffer(encodedContent || 'https://example.com', {
      ...qrOptions,
      type: 'png',
    });

    // If a logo is configured, composite it onto the PNG with sharp
    if (style.logoUrl) {
      try {
        const logoBuffer = Buffer.from(style.logoUrl.split(',')[1] ?? '', 'base64');
        const logoSize = Math.round(width * 0.2);
        const compositeBuffer = await sharp(pngBuffer)
          .composite([{
            input: await sharp(logoBuffer).resize(logoSize, logoSize, { fit: 'inside' }).toBuffer(),
            gravity: 'center',
          }])
          .png()
          .toBuffer();
        return compositeBuffer;
      } catch {
        // If logo compositing fails, return the QR without logo
        return pngBuffer;
      }
    }

    return pngBuffer;
  }

  // ---------- Helpers ----------
  getEncodedContent(qr: QrCodeEntity): string {
    if (qr.type === QrType.DYNAMIC && qr.dynamicContent) {
      const baseDomain = this.configService.get<string>('BASE_DOMAIN', 'http://localhost:3000');
      return `${baseDomain}/r/${qr.dynamicContent.shortCode}`;
    }

    if (!qr.staticContent) return '';
    const c = qr.staticContent.content;

    switch (qr.category) {
      case QrCategory.URL:
        return String(c['url'] ?? '');
      case QrCategory.TEXT:
        return String(c['text'] ?? '');
      case QrCategory.EMAIL:
        return `mailto:${c['email'] ?? ''}?subject=${encodeURIComponent(String(c['subject'] ?? ''))}&body=${encodeURIComponent(String(c['body'] ?? ''))}`;
      case QrCategory.PHONE:
        return `tel:${c['phone'] ?? ''}`;
      case QrCategory.SMS:
        return `sms:${c['phone'] ?? ''}?body=${encodeURIComponent(String(c['body'] ?? ''))}`;
      case QrCategory.WIFI:
        return `WIFI:T:${c['encryption'] ?? 'WPA'};S:${c['ssid'] ?? ''};P:${c['password'] ?? ''};H:${c['hidden'] ? 'true' : 'false'};;`;
      case QrCategory.VCARD:
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${c['name'] ?? ''}\nORG:${c['org'] ?? ''}\nTEL:${c['phone'] ?? ''}\nEMAIL:${c['email'] ?? ''}\nURL:${c['url'] ?? ''}\nEND:VCARD`;
      default:
        return '';
    }
  }

  private validateUrl(url: string): void {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new BadRequestException('Only http/https URLs are allowed');
      }
    } catch {
      throw new BadRequestException('Invalid URL');
    }
  }

  private async generateUniqueShortCode(): Promise<string> {
    let code = nanoid(8);
    let exists = await this.dynamicRepo.findOne({ where: { shortCode: code } });
    let attempts = 0;
    while (exists && attempts < 10) {
      code = nanoid(8);
      exists = await this.dynamicRepo.findOne({ where: { shortCode: code } });
      attempts++;
    }
    if (exists) throw new BadRequestException('Failed to generate unique short code');
    return code;
  }
}
