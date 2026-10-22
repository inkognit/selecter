import { Module } from '@nestjs/common';
import { TASKS_REPOSITORY } from './application/tasks.port';
import { TasksService } from './application/tasks.service';
import { PrismaTasksRepository } from './infrastructure/tasks.repository.prisma';
import { TasksController } from './presentation/tasks.controller';

@Module({
  controllers: [TasksController],
  providers: [TasksService, { provide: TASKS_REPOSITORY, useClass: PrismaTasksRepository }],
})
export class TasksModule {}
