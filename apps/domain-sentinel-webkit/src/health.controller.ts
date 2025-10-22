import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'domain-sentinel-webkit',
      timestamp: new Date().toISOString(),
    };
  }
}
