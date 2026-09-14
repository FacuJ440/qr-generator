import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrScanEntity, DeviceType } from './qr-scan.entity';
import { QrCodeEntity } from '../qr-codes/qr-code.entity';
import { QrDynamicContentEntity } from '../qr-codes/qr-dynamic-content.entity';

export interface AnalyticsSummary {
  totalScans: number;
  scansByDate: { date: string; count: number }[];
  scansByDevice: { key: string; count: number }[];
  scansByBrowser: { key: string; count: number }[];
  scansByCountry: { key: string; count: number }[];
  scansByOs: { key: string; count: number }[];
}

export interface AnalyticsDateRange {
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(QrScanEntity)
    private readonly scanRepo: Repository<QrScanEntity>,
    @InjectRepository(QrCodeEntity)
    private readonly qrRepo: Repository<QrCodeEntity>,
    @InjectRepository(QrDynamicContentEntity)
    private readonly dynamicRepo: Repository<QrDynamicContentEntity>,
  ) {}

  async getSummary(
    qrCodeId: string,
    range?: AnalyticsDateRange,
  ): Promise<AnalyticsSummary> {
    // Verify QR code exists
    const qr = await this.qrRepo.findOne({ where: { id: qrCodeId } });
    if (!qr) throw new NotFoundException('QR code not found');

    const qb = this.scanRepo.createQueryBuilder('scan').where('scan.qr_code_id = :qrCodeId', { qrCodeId });

    if (range?.startDate) {
      qb.andWhere('scan.scanned_at >= :startDate', { startDate: range.startDate });
    }
    if (range?.endDate) {
      qb.andWhere('scan.scanned_at <= :endDate', { endDate: range.endDate });
    }

    const totalScans = await qb.getCount();

    // Scans by date (daily aggregation)
    const scansByDateRaw = await this.scanRepo
      .createQueryBuilder('scan')
      .select("TO_CHAR(scan.scanned_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('scan.qr_code_id = :qrCodeId', { qrCodeId })
      .groupBy("TO_CHAR(scan.scanned_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    const scansByDate = scansByDateRaw.map((r) => ({ date: r.date, count: parseInt(r.count, 10) }));

    // Scans by device
    const scansByDevice = await this.groupByField(qrCodeId, 'deviceType');
    const scansByBrowser = await this.groupByField(qrCodeId, 'browser');
    const scansByOs = await this.groupByField(qrCodeId, 'os');
    const scansByCountry = await this.groupByField(qrCodeId, 'country');

    return {
      totalScans,
      scansByDate,
      scansByDevice,
      scansByBrowser,
      scansByOs,
      scansByCountry,
    };
  }

  async exportCsv(qrCodeId: string): Promise<string> {
    const qr = await this.qrRepo.findOne({ where: { id: qrCodeId } });
    if (!qr) throw new NotFoundException('QR code not found');

    const scans = await this.scanRepo.find({
      where: { qrCodeId },
      order: { scannedAt: 'DESC' },
    });

    const header = 'scanned_at,ip_address,device_type,browser,os,country,city,referrer\n';
    const rows = scans
      .map((s) =>
        [
          s.scannedAt.toISOString(),
          s.ipAddress ?? '',
          s.deviceType,
          s.browser ?? '',
          s.os ?? '',
          s.country ?? '',
          s.city ?? '',
          s.referrer ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    return header + rows;
  }

  private async groupByField(
    qrCodeId: string,
    field: string,
  ): Promise<{ key: string; count: number }[]> {
    const results = await this.scanRepo
      .createQueryBuilder('scan')
      .select(`scan.${field}`, 'key')
      .addSelect('COUNT(*)', 'count')
      .where('scan.qr_code_id = :qrCodeId', { qrCodeId })
      .andWhere(`scan.${field} IS NOT NULL`)
      .groupBy(`scan.${field}`)
      .orderBy('count', 'DESC')
      .getRawMany<{ key: string | null; count: string }>();

    return results.map((r) => ({ key: r.key ?? 'unknown', count: parseInt(r.count, 10) }));
  }
}
