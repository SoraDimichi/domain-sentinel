import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserType } from './modules/domain-warning/models/domain-warning-feed.entity';

@Controller('health')
export class HealthController {
  private readonly browserType: BrowserType;

  constructor(private readonly configService: ConfigService) {
    this.browserType = this.configService.get<BrowserType>('BROWSER_TYPE') || BrowserType.CHROME;
  }

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'browser-agnostic',
      browserType: this.browserType,
      timestamp: new Date().toISOString(),
    };
  }
}
