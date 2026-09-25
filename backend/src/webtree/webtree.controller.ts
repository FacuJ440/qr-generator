import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebtreeService } from './webtree.service';
import { CreateWebtreePageDto, UpdateWebtreePageDto, CreateWebtreeLinkDto, UpdateWebtreeLinkDto } from './dto/webtree.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Webtree')
@Controller('webtree')
export class WebtreeController {
  constructor(private readonly webtreeService: WebtreeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Webtree page' })
  create(@Body() dto: CreateWebtreePageDto, @CurrentUser() user: { id: string }) {
    return this.webtreeService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all Webtree pages for the current user' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.webtreeService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single Webtree page by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.webtreeService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a Webtree page (title, bio, colors, links, etc.)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebtreePageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.webtreeService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a Webtree page permanently' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.webtreeService.delete(id, user.id);
  }

  @Post(':id/links')
  @ApiOperation({ summary: 'Add a single link to a Webtree page' })
  addLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWebtreeLinkDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.webtreeService.addLink(id, { label: dto.label, url: dto.url, icon: dto.icon }, user.id);
  }

  @Patch(':id/links/:linkId')
  @ApiOperation({ summary: 'Update a single link' })
  updateLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body() dto: UpdateWebtreeLinkDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.webtreeService.updateLink(id, linkId, dto, user.id);
  }

  @Delete(':id/links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a single link' })
  deleteLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.webtreeService.deleteLink(id, linkId, user.id);
  }
}
