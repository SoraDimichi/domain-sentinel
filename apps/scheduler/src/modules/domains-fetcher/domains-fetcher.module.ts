import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DomainModule } from '../domain/domain.module';
import { HttpClientProvider } from './http-client.provider';
import { DomainsFetcherScheduler } from './domains-fetcher.scheduler';
import { DomainsFetcherService } from './domains-fetcher.service';

@Module({
  imports: [
    ConfigModule,
    DomainModule
  ],
  providers: [
    HttpClientProvider,
    DomainsFetcherService,
    DomainsFetcherScheduler
  ],
  exports: [
    DomainsFetcherService
  ]
})
export class DomainsFetcherModule {}
