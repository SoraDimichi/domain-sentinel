import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cron from 'cron';
import { DomainsFetcherService } from './domains-fetcher.service';

@Injectable()
export class DomainsFetcherScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(DomainsFetcherScheduler.name);
  private job: cron.CronJob | null = null;

  constructor(private readonly domainsFetcherService: DomainsFetcherService) {}

  async onApplicationBootstrap() {
    // Run every 10 minutes
    const cronExpression = '0 */10 * * * *';

    this.setupCronJob(cronExpression);

    // Run immediately on startup
    await this.handleCron();
  }

  private setupCronJob(cronExpression: string) {
    this.job = new cron.CronJob(cronExpression, () => this.handleCron());

    this.job.start();
    this.logger.log(`Domains fetcher scheduler started with cron expression: ${cronExpression}`);
  }

  async handleCron() {
    this.logger.log('Fetching domains from API...');
    try {
      await this.domainsFetcherService.fetchDomains();
      this.logger.log('Domains fetched successfully');
    } catch (error) {
      this.logger.error(`Failed to fetch domains: ${error.message}`, error.stack);
    }
  }
}

