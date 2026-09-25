import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { UpdateUserDto, CreateUserDto } from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (admin only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto.email, dto.name, dto.password);
    if (dto.plan) user.plan = dto.plan;
    if (dto.role) user.role = dto.role;
    return this.usersService.update(user.id, { plan: dto.plan, role: dto.role });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user (admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.delete(id);
  }
}
