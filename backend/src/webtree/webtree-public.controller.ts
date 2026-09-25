import { Controller, Get, Param, Redirect, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { WebtreeService } from './webtree.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Webtree Public')
@Controller('p')
export class WebtreePublicController {
  constructor(private readonly webtreeService: WebtreeService) {}

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get a public Webtree page by slug (returns JSON)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.webtreeService.findBySlug(slug);
  }
}
