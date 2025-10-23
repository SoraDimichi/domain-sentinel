import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'playwright';

@Injectable()
export class WarningDetectorService {
  private readonly logger = new Logger(WarningDetectorService.name);

  async detectWarning(page: Page): Promise<boolean> {
    try {
      // Check for common deceptive website warning indicators in WebKit
      const hasWarning = await page.evaluate(() => {
        // Check for WebKit security warning page elements
        const hasWarningElements =
          document.querySelector('.warning-message') !== null ||
          document.querySelector('.security-warning') !== null;

        // Check page title
        const hasWarningTitle =
          document.title.includes('Warning') ||
          document.title.includes('Security') ||
          document.title.includes('Deceptive');

        // Check page content
        const pageContent = document.body.textContent || '';
        const hasWarningContent =
          pageContent.includes('deceptive site') ||
          pageContent.includes('unsafe') ||
          pageContent.includes('phishing') ||
          pageContent.includes('malware') ||
          pageContent.includes('security risk');

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
