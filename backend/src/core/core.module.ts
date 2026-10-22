import { Global, Module } from '@nestjs/common';
import { AppConfig, loadAppConfig } from './config/app-config';
import { PrismaService } from './prisma/prisma.service';

/** Вся инфраструктура (конфиг, БД) создаётся только здесь и раздаётся через DI. */
@Global()
@Module({
  providers: [{ provide: AppConfig, useFactory: loadAppConfig }, PrismaService],
  exports: [AppConfig, PrismaService],
})
export class CoreModule {}
