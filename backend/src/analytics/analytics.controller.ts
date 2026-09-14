import { Controller, Get, Param, Query, Res, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class AnalyticsRangeDto {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':qrCodeId')
  @ApiOperation({ summary: 'Get analytics summary for a QR code' })
  getSummary(
    @Param('qrCodeId', ParseUUIDPipe) qrCodeId: string,
    @Query() range: AnalyticsRangeDto,
  ) {
    return this.analyticsService.getSummary(qrCodeId, {
      startDate: range.startDate ? new Date(range.startDate) : undefined,
      endDate: range.endDate ? new Date(range.endDate) : undefined,
    });
  }

  @Get(':qrCodeId/export')
  @ApiOperation({ summary: 'Export scan data as CSV' })
  async exportCsv(
    @Param('qrCodeId', ParseUUIDPipe) qrCodeId: string,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.analyticsService.exportCsv(qrCodeId);
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="analytics-${qrCodeId}.csv"`);
    res.send(csv);
  }
}
