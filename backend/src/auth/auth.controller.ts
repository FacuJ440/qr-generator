import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('setup-admin')
  @Public()
  @ApiOperation({ summary: 'Promote the first user to admin (only works if no admin exists)' })
  async setupAdmin() {
    const allUsers = await this.usersService.findAll();
    const hasAdmin = allUsers.some((u) => u.role === UserRole.ADMIN);
    if (hasAdmin) return { message: 'Admin already exists. Use the admin dashboard instead.' };
    if (allUsers.length === 0) return { message: 'No users found. Register first, then call this endpoint.' };

    const firstUser = allUsers[0];
    await this.usersService.update(firstUser.id, { role: UserRole.ADMIN });
    return { message: `User "${firstUser.email}" promoted to admin successfully.` };
  }
}
