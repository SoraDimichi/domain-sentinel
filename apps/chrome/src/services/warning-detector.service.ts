import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'playwright';

@Injectable()
export class WarningDetectorService {
  private readonly logger = new Logger(WarningDetectorService.name);

  async detectWarning(page: Page): Promise<boolean> {
    try {
      const hasWarning = await page.evaluate(() => {
        const hasWarningElements =
          document.querySelector('.interstitial-wrapper') !== null || document.querySelector('.icon-generic') !== null;

        const hasWarningTitle =
          document.title.includes('Security') || document.title.includes('Warning') || document.title.includes('Deceptive');

        const pageContent = document.body.textContent || '';
        const hasWarningContent =
          pageContent.includes('deceptive site') ||
          pageContent.includes('unsafe') ||
          pageContent.includes('phishing') ||
          pageContent.includes('malware');

        return hasWarningElements || hasWarningTitle || hasWarningContent;
      });

      if (hasWarning) {
        this.logger.log('Deceptive website warning detected');
      } else {
        this.logger.log('No warning detected');
      }

      return hasWarning;
    } catch (error) {
      this.logger.error(`Error detecting warning: ${error.message}`);
      return false;
    }
  }
}
