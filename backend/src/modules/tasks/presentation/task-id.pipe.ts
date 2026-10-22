import { Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { TaskNotFoundError } from '../application/tasks.errors';

/** id не UUID — такой задачи заведомо нет: 404 task_not_found, а не 422 (решение этапа 1). */
@Injectable()
export class TaskIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) throw new TaskNotFoundError(value);
    return value;
  }
}
