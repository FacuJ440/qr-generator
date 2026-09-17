import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  QrType,
  QrCategory,
  QrStatus,
  QrEyeShape,
  QrErrorCorrectionLevel,
} from '../qr-code.entity';

export class QrStyleConfigDto {
  @ApiPropertyOptional({ example: '#000000' })
  @IsOptional()
  @IsString()
  foregroundColor?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ enum: QrEyeShape })
  @IsOptional()
  @IsEnum(QrEyeShape)
  eyeShape?: QrEyeShape;

  @ApiPropertyOptional({ enum: QrErrorCorrectionLevel })
  @IsOptional()
  @IsEnum(QrErrorCorrectionLevel)
  errorCorrectionLevel?: QrErrorCorrectionLevel;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  margin?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  width?: number;
}

export class CreateQrCodeDto {
  @ApiProperty({ enum: QrType })
  @IsEnum(QrType)
  type!: QrType;

  @ApiProperty({ enum: QrCategory })
  @IsEnum(QrCategory)
  category!: QrCategory;

  @ApiProperty({ example: 'My QR Code' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'uuid-of-tag' })
  @IsOptional()
  @IsString()
  tagId?: string;

  @ApiPropertyOptional({ type: QrStyleConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QrStyleConfigDto)
  styleConfig?: QrStyleConfigDto;

  // --- Static content (required when type = static) ---
  @ApiPropertyOptional({ description: 'Content for static QR (varies by category)' })
  @ValidateIf((o) => o.type === QrType.STATIC)
  @IsNotEmpty()
  @IsOptional()
  content?: Record<string, unknown>;

  // --- Dynamic content (required when type = dynamic) ---
  @ApiPropertyOptional({ example: 'https://example.com/destination' })
  @ValidateIf((o) => o.type === QrType.DYNAMIC)
  @IsUrl({ require_protocol: true })
  @IsOptional()
  targetUrl?: string;

  @ApiPropertyOptional({ description: 'Expiration date for dynamic QR' })
  @ValidateIf((o) => o.type === QrType.DYNAMIC)
  @IsOptional()
  expiresAt?: Date;
}

export class UpdateQrCodeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'uuid-of-tag' })
  @IsOptional()
  @IsString()
  tagId?: string;

  @ApiPropertyOptional({ type: QrStyleConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => QrStyleConfigDto)
  styleConfig?: QrStyleConfigDto;

  @ApiPropertyOptional({ enum: QrStatus })
  @IsOptional()
  @IsEnum(QrStatus)
  status?: QrStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  targetUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  expiresAt?: Date;
}

export class QrCodeFilterDto {
  @ApiPropertyOptional({ enum: QrType })
  @IsOptional()
  @IsEnum(QrType)
  type?: QrType;

  @ApiPropertyOptional({ enum: QrStatus })
  @IsOptional()
  @IsEnum(QrStatus)
  status?: QrStatus;

  @ApiPropertyOptional({ enum: QrCategory })
  @IsOptional()
  @IsEnum(QrCategory)
  category?: QrCategory;

  @ApiPropertyOptional({ description: 'Search by title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by tag ID' })
  @IsOptional()
  @IsString()
  tagId?: string;

  @ApiPropertyOptional({ description: 'Sort by scans descending' })
  @IsOptional()
  sortByScans?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}

export class GenerateQrImageDto {
  @ApiPropertyOptional({ enum: ['png', 'svg'], default: 'png' })
  @IsOptional()
  @IsString()
  format?: 'png' | 'svg';
}
