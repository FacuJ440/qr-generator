import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrScanEntity } from './qr-scan.entity';
import { QrCodeEntity } from '../qr-codes/qr-code.entity';
import { QrDynamicContentEntity } from '../qr-codes/qr-dynamic-content.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QrScanEntity, QrCodeEntity, QrDynamicContentEntity])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
