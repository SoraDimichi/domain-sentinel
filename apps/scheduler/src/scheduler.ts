import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cron from 'cron';
import { DomainBatchService } from './modules/batch/batch.service';
import { SynchronizationResiliencer } from './modules/synchronization/synchronization.resiliencer';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerService.name);
  private job: cron.CronJob | null = null;

  constructor(
    private readonly domainBatchService: DomainBatchService,
    private readonly synchronizationResiliencer: SynchronizationResiliencer,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const enabled = this.configService.get<boolean>('scheduler.enabled');
    const cronExpression = this.configService.get<string>('scheduler.cronExpression') || '*/5 * * * *';

    if (enabled) {
      this.setupCronJob(cronExpression);
    } else {
      this.logger.log('Price update scheduler is disabled');
    }
  }

  private setupCronJob(cronExpression: string) {
    this.job = new cron.CronJob(cronExpression, this.handleCron.bind(this));

    this.job.start();
    this.logger.log(`Price update scheduler started with cron expression: ${cronExpression}`);
  }

  async handleCron() {
    this.logger.log('Starting domain synchronization...');
    await this.synchronizationResiliencer.sync();

    this.logger.log('Preparing and sending token batches...');
    await this.domainBatchService.sendDomainBatch();
  }
}
