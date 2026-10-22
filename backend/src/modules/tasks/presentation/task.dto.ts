import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import {
  DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
  type TaskPriority,
  type TaskStatus,
} from '../domain/task';

/** Обрезка пробелов ДО проверки длины: «   » — пустое название, а не три символа. */
const trim = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim() : value);

export class CreateTaskDto {
  @ApiProperty({ minLength: 1, maxLength: TITLE_MAX_LENGTH, example: 'Настроить CI' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @ApiPropertyOptional({ type: String, maxLength: DESCRIPTION_MAX_LENGTH, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ApiPropertyOptional({ enum: TASK_PRIORITIES, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(TASK_PRIORITIES)
  priority?: TaskPriority;
}

export class UpdateTaskDto {
  // ValidateIf, а не IsOptional: IsOptional пропустил бы title: null.
  @ApiPropertyOptional({ minLength: 1, maxLength: TITLE_MAX_LENGTH })
  @ValidateIf((o: UpdateTaskDto) => o.title !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: DESCRIPTION_MAX_LENGTH,
    nullable: true,
    description: 'null — очистить',
  })
  @IsOptional()
  @IsString()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ApiPropertyOptional({ enum: TASK_PRIORITIES })
  @ValidateIf((o: UpdateTaskDto) => o.priority !== undefined)
  @IsEnum(TASK_PRIORITIES)
  priority?: TaskPriority;
}

export class MoveTaskDto {
  @ApiProperty({ enum: TASK_STATUSES })
  @IsEnum(TASK_STATUSES)
  status!: TaskStatus;

  @ApiProperty({ description: 'Индекс в целевой колонке; вне диапазона приводится к началу или концу', example: 0 })
  @IsInt()
  position!: number;
}
