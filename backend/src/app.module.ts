import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { QrCodesModule } from './qr-codes/qr-codes.module';
import { RedirectModule } from './redirect/redirect.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'qr_generator'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNC', false),
        logging: false,
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 100 },
      { name: 'medium', ttl: 10000, limit: 1000 },
      { name: 'long', ttl: 60000, limit: 10000 },
    ]),
    QrCodesModule,
    RedirectModule,
    AnalyticsModule,
    TagsModule,
  ],
})
export class AppModule {}
