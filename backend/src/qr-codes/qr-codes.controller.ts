import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { QrCodesService } from './qr-codes.service';
import { CreateQrCodeDto, UpdateQrCodeDto, QrCodeFilterDto, GenerateQrImageDto } from './dto/qr-code.dto';

@ApiTags('QR Codes')
@Controller('qr-codes')
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new QR code (static or dynamic)' })
  create(@Body() dto: CreateQrCodeDto) {
    return this.qrCodesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List QR codes with filters' })
  findAll(@Query() filters: QrCodeFilterDto) {
    return this.qrCodesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single QR code by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.qrCodesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a QR code (dynamic: target, title, status, style)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQrCodeDto,
  ) {
    return this.qrCodesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a QR code permanently' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.qrCodesService.delete(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a QR code (soft delete)' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.qrCodesService.archive(id);
  }

  @Get(':id/image')
  @ApiOperation({ summary: 'Download QR code image (PNG or SVG)' })
  async getImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: GenerateQrImageDto,
    @Res() res: Response,
  ) {
    const format = dto.format ?? 'png';
    const buffer = await this.qrCodesService.generateImage(id, format);
    if (format === 'svg') {
      res.set('Content-Type', 'image/svg+xml');
    } else {
      res.set('Content-Type', 'image/png');
    }
    res.set('Content-Disposition', `attachment; filename="qr-${id}.${format}"`);
    res.send(buffer);
  }
}
