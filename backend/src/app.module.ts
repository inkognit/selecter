import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { HealthModule } from './modules/health/health.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({ imports: [CoreModule, HealthModule, TasksModule] })
export class AppModule {}
