import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Browser, chromium, webkit } from 'playwright';
import { WarningDetectorService } from './warning-detector.service';
import { ConfigService } from '@nestjs/config';
import { BrowserType } from '../modules/domain-warning/models/domain-warning-feed.entity';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser;
  private readonly browserType: BrowserType;

  constructor(
    private readonly warningDetectorService: WarningDetectorService,
    private readonly configService: ConfigService,
  ) {
    this.browserType = this.configService.get<BrowserType>('BROWSER_TYPE') || BrowserType.CHROME;
  }

  async onModuleInit() {
    this.browser = await this.launchBrowser();
    this.logger.log(`${this.browserType} browser launched`);
  }

  private async launchBrowser(): Promise<Browser> {
    const options = { headless: true };

    switch (this.browserType) {
      case BrowserType.CHROME:
        return chromium.launch(options);
      case BrowserType.WEBKIT:
        return webkit.launch(options);
      default:
        this.logger.warn(`Unknown browser type: ${this.browserType}, defaulting to Chrome`);
        return chromium.launch(options);
    }
  }

  private getUserAgent(): string {
    switch (this.browserType) {
      case BrowserType.CHROME:
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36';
      case BrowserType.WEBKIT:
        return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15';
      default:
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36';
    }
  }

  async checkDomain(domainName: string): Promise<boolean> {
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: this.getUserAgent(),
    });

    try {
      const page = await context.newPage();

      this.logger.log(`Checking domain: ${domainName}`);

      const currentUrl = page.url();
      const targetUrl = `https://${domainName}`;

      if (!currentUrl.includes(domainName)) {
        this.logger.log(`Navigating to ${targetUrl}`);
        await page.goto(targetUrl, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
      } else {
        this.logger.log(`Page already loaded with ${currentUrl}`);
      }

      const hasWarning = await this.warningDetectorService.detectWarning(page);

      await context.close();
      return hasWarning;
    } catch (error) {
      this.logger.error(`Error checking domain ${domainName}: ${error.message}`);
      await context.close();
      return false;
    }
  }

  async checkDomainWithRetry(domainName: string, maxRetries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.checkDomain(domainName);
      } catch (error) {
        if (attempt === maxRetries) {
          this.logger.error(`Failed to check domain ${domainName} after ${maxRetries} attempts`);
          return false;
        }

        const delay = Math.pow(2, attempt) * 1000;
        this.logger.warn(`Retrying domain ${domainName} in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  async onModuleDestroy() {
    await this.browser.close();
    this.logger.log(`${this.browserType} browser closed`);
  }
}
