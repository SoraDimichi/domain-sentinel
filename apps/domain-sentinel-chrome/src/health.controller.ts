import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'domain-sentinel-chrome',
      timestamp: new Date().toISOString(),
    };
  }
}
