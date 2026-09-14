import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrDynamicContentEntity } from '../qr-codes/qr-dynamic-content.entity';
import { QrScanEntity } from '../analytics/qr-scan.entity';
import { RedirectService } from './redirect.service';
import { RedirectController } from './redirect.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QrDynamicContentEntity, QrScanEntity])],
  providers: [RedirectService],
  controllers: [RedirectController],
  exports: [RedirectService],
})
export class RedirectModule {}
