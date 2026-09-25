import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(email: string, name: string, password: string): Promise<UserEntity> {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({ email, name, passwordHash });
    return this.userRepo.save(user);
  }

  async validatePassword(user: UserEntity, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  // ---------- Admin CRUD ----------
  async findAll(): Promise<UserEntity[]> {
    return this.userRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: { name?: string; email?: string; plan?: string; role?: UserRole }): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await this.findByEmail(data.email);
      if (existing) throw new ConflictException('Email already in use');
      user.email = data.email;
    }
    if (data.name !== undefined) user.name = data.name;
    if (data.plan !== undefined) user.plan = data.plan;
    if (data.role !== undefined) user.role = data.role;

    return this.userRepo.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.remove(user);
  }

  async count(): Promise<number> {
    return this.userRepo.count();
  }
}
