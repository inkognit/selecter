import { ApiProperty } from '@nestjs/swagger';

export class HealthResponse {
  @ApiProperty({ example: 'ok' })
  readonly status: 'ok';

  constructor(status: 'ok') {
    this.status = status;
  }
}
