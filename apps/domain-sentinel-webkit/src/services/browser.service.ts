import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Browser, webkit } from 'playwright';
import { WarningDetectorService } from './warning-detector.service';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser;

  constructor(
    private readonly warningDetectorService: WarningDetectorService,
  ) {}

  async onModuleInit() {
    this.browser = await webkit.launch({
      headless: true,
    });
    this.logger.log('WebKit browser launched');
  }

  async checkDomain(domainName: string): Promise<boolean> {
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    });

    try {
      // Create a new page
      const page = await context.newPage();

      // Navigate to the domain
      this.logger.log(`Checking domain: ${domainName}`);
      await page.goto(`https://${domainName}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Check for deceptive website warnings
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

        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        this.logger.warn(`Retrying domain ${domainName} in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  async onModuleDestroy() {
    await this.browser.close();
    this.logger.log('WebKit browser closed');
  }
}
