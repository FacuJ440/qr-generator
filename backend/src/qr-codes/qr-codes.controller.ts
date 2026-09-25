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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('QR Codes')
@Controller('qr-codes')
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new QR code (static or dynamic)' })
  create(@Body() dto: CreateQrCodeDto, @CurrentUser() user: { id: string }) {
    return this.qrCodesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List QR codes with filters' })
  findAll(@Query() filters: QrCodeFilterDto, @CurrentUser() user: { id: string }) {
    return this.qrCodesService.findAll(filters, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single QR code by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.qrCodesService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a QR code (dynamic: target, title, status, style)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQrCodeDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.qrCodesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a QR code permanently' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.qrCodesService.delete(id, user.id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a QR code (soft delete)' })
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.qrCodesService.archive(id, user.id);
  }

  @Get(':id/image')
  @Public()
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
