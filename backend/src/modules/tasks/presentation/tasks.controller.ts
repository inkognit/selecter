import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TasksService } from '../application/tasks.service';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './task.dto';
import { TaskIdPipe } from './task-id.pipe';
import { DeletedTaskResponse, TaskResponse } from './task.response.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Все задачи доски, по колонкам и позициям' })
  @ApiResponse({ status: 200, type: [TaskResponse] })
  async list(): Promise<TaskResponse[]> {
    return (await this.tasks.list()).map((t) => new TaskResponse(t));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Одна задача' })
  @ApiResponse({ status: 200, type: TaskResponse })
  @ApiResponse({ status: 404, description: 'task_not_found' })
  async get(@Param('id', TaskIdPipe) id: string): Promise<TaskResponse> {
    return new TaskResponse(await this.tasks.get(id));
  }

  @Post()
  @ApiOperation({ summary: 'Создать задачу в конце колонки «Новая»' })
  @ApiResponse({ status: 201, type: TaskResponse })
  @ApiResponse({ status: 422, description: 'validation_failed' })
  async create(@Body() dto: CreateTaskDto): Promise<TaskResponse> {
    return new TaskResponse(await this.tasks.create(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить название, описание, приоритет' })
  @ApiResponse({ status: 200, type: TaskResponse })
  @ApiResponse({ status: 404, description: 'task_not_found' })
  @ApiResponse({ status: 422, description: 'validation_failed' })
  async update(@Param('id', TaskIdPipe) id: string, @Body() dto: UpdateTaskDto): Promise<TaskResponse> {
    return new TaskResponse(await this.tasks.update(id, dto));
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Перенести в колонку и/или на позицию' })
  @ApiResponse({ status: 200, type: TaskResponse })
  @ApiResponse({ status: 404, description: 'task_not_found' })
  @ApiResponse({ status: 409, description: 'task_conflict' })
  async move(@Param('id', TaskIdPipe) id: string, @Body() dto: MoveTaskDto): Promise<TaskResponse> {
    return new TaskResponse(await this.tasks.move(id, dto.status, dto.position));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить задачу' })
  @ApiResponse({ status: 200, type: DeletedTaskResponse })
  @ApiResponse({ status: 404, description: 'task_not_found' })
  async remove(@Param('id', TaskIdPipe) id: string): Promise<DeletedTaskResponse> {
    return new DeletedTaskResponse((await this.tasks.remove(id)).id);
  }
}
