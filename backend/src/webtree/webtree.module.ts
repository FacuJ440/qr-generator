import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebtreePageEntity } from './webtree-page.entity';
import { WebtreeLinkEntity } from './webtree-link.entity';
import { WebtreeService } from './webtree.service';
import { WebtreeController } from './webtree.controller';
import { WebtreePublicController } from './webtree-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WebtreePageEntity, WebtreeLinkEntity])],
  providers: [WebtreeService],
  controllers: [WebtreeController, WebtreePublicController],
  exports: [WebtreeService],
})
export class WebtreeModule {}
