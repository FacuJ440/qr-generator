import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrCodeEntity } from './qr-code.entity';
import { QrStaticContentEntity } from './qr-static-content.entity';
import { QrDynamicContentEntity } from './qr-dynamic-content.entity';
import { QrCodesService } from './qr-codes.service';
import { QrCodesController } from './qr-codes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QrCodeEntity, QrStaticContentEntity, QrDynamicContentEntity])],
  providers: [QrCodesService],
  controllers: [QrCodesController],
  exports: [QrCodesService],
})
export class QrCodesModule {}
