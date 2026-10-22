import { ApiProperty } from '@nestjs/swagger';
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskPriority, type TaskStatus } from '../domain/task';

/** Ответ API по задаче. Поля присваиваются поимённо — лишнее наружу не уходит физически. */
export class TaskResponse {
  @ApiProperty({ format: 'uuid' }) readonly id: string;
  @ApiProperty() readonly title: string;
  @ApiProperty({ type: String, nullable: true }) readonly description: string | null;
  @ApiProperty({ enum: TASK_STATUSES }) readonly status: TaskStatus;
  @ApiProperty({ enum: TASK_PRIORITIES }) readonly priority: TaskPriority;
  @ApiProperty() readonly position: number;
  @ApiProperty({ format: 'date-time' }) readonly createdAt: string;
  @ApiProperty({ format: 'date-time' }) readonly updatedAt: string;

  constructor(task: Task) {
    this.id = task.id;
    this.title = task.title;
    this.description = task.description;
    this.status = task.status;
    this.priority = task.priority;
    this.position = task.position;
    this.createdAt = task.createdAt.toISOString();
    this.updatedAt = task.updatedAt.toISOString();
  }
}

export class DeletedTaskResponse {
  @ApiProperty({ format: 'uuid' }) readonly id: string;

  constructor(id: string) {
    this.id = id;
  }
}
