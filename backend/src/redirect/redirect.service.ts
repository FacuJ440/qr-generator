import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as UAParser from 'ua-parser-js';
import { QrDynamicContentEntity } from '../qr-codes/qr-dynamic-content.entity';
import { QrCodeEntity, QrStatus, QrType } from '../qr-codes/qr-code.entity';
import { QrScanEntity, DeviceType } from '../analytics/qr-scan.entity';

export interface RedirectResult {
  shouldRedirect: boolean;
  targetUrl?: string;
  qrCodeId: string;
}

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    @InjectRepository(QrDynamicContentEntity)
    private readonly dynamicRepo: Repository<QrDynamicContentEntity>,
    @InjectRepository(QrScanEntity)
    private readonly scanRepo: Repository<QrScanEntity>,
  ) {}

  async resolveAndTrack(
    shortCode: string,
    metadata: {
      ip: string | null;
      userAgent: string | null;
      referrer: string | null;
    },
  ): Promise<RedirectResult> {
    const dynamic = await this.dynamicRepo.findOne({
      where: { shortCode },
      relations: ['qrCode'],
    });

    if (!dynamic || !dynamic.qrCode) {
      throw new NotFoundException('QR code not found');
    }

    const qr = dynamic.qrCode;

    // Track scan asynchronously (fire-and-forget for performance at scale)
    this.trackScan(dynamic.qrCodeId, metadata).catch((err) => {
      this.logger.error(`Failed to track scan: ${err.message}`);
    });

    // Check status
    if (qr.status !== QrStatus.ACTIVE || qr.isArchived) {
      return { shouldRedirect: false, qrCodeId: qr.id };
    }

    // Check expiration
    if (dynamic.expiresAt && dynamic.expiresAt < new Date()) {
      return { shouldRedirect: false, qrCodeId: qr.id };
    }

    // Increment scan count
    await this.dynamicRepo.increment({ id: dynamic.id }, 'scanCount', 1);

    return { shouldRedirect: true, targetUrl: dynamic.targetUrl, qrCodeId: qr.id };
  }

  private async trackScan(
    qrCodeId: string,
    metadata: { ip: string | null; userAgent: string | null; referrer: string | null },
  ): Promise<void> {
    let deviceType = DeviceType.UNKNOWN;
    let browser: string | null = null;
    let os: string | null = null;

    if (metadata.userAgent) {
      const parser = new UAParser.UAParser(metadata.userAgent);
      const result = parser.getResult();

      const device = result.device.type;
      if (device === 'mobile') deviceType = DeviceType.MOBILE;
      else if (device === 'tablet') deviceType = DeviceType.TABLET;
      else if (device === 'desktop' || result.device.vendor) deviceType = DeviceType.DESKTOP;

      browser = result.browser.name ?? null;
      os = result.os.name ?? null;
    }

    const scan = this.scanRepo.create({
      qrCodeId,
      scannedAt: new Date(),
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      deviceType,
      browser,
      os,
      country: null, // Would use a GeoIP service in production
      city: null,
      referrer: metadata.referrer,
    });

    await this.scanRepo.save(scan);
  }
}
