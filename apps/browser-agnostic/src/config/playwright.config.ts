import { DynamicModule } from '@nestjs/common';
import { PlaywrightModule } from 'nestjs-playwright';
import { ConfigService } from '@nestjs/config';
import { BrowserType } from '../modules/domain-warning/models/domain-warning-feed.entity';

export const getPlaywrightConfig = (): DynamicModule => {
  return {
    module: PlaywrightModule,
    imports: [],
    providers: [
      {
        provide: PlaywrightModule,
        useFactory: (configService: ConfigService) => {
          const browserType = configService.get<BrowserType>('BROWSER_TYPE') || BrowserType.CHROME;
          const browserName = browserType === BrowserType.CHROME ? 'ChromeBrowser' : 'WebKitBrowser';

          return PlaywrightModule.forRoot({
            isGlobal: true,
            headless: true,
          }, browserName);
        },
        inject: [ConfigService],
      },
    ],
    exports: [PlaywrightModule],
  };
};
