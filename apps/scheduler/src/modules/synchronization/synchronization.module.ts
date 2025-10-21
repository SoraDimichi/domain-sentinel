import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DomainRepositoryModule } from '../repository/domain.module';
import { HttpClientProvider } from './http-client.provider';
import { SynchronizationResiliencer } from './synchronization.resiliencer';
import { SynchronizationService } from './synchronization.service';

@Module({
  imports: [ConfigModule, DomainRepositoryModule],
  providers: [HttpClientProvider, SynchronizationService, SynchronizationResiliencer],
  exports: [SynchronizationResiliencer],
})
export class SynchronizationModule {}
