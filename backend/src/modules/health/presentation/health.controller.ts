import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from './health.response.dto';

/** Готовность API: веб в связке launch.json ждёт этот ответ перед стартом. */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API запущен и принимает запросы' })
  check(): HealthResponse {
    return new HealthResponse('ok');
  }
}
