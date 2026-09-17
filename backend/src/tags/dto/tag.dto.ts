import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Campaña' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  text!: string;

  @ApiProperty({ example: '#3b82f6' })
  @IsString()
  @MaxLength(20)
  color!: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'Campaña' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  text?: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
