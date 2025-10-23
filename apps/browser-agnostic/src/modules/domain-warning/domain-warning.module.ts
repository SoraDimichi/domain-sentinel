import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DomainWarningFeed, DomainWarningFeedSchema } from './models/domain-warning-feed.entity';
import { DomainWarningFeedRepository } from './repository/domain-warning-feed.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DomainWarningFeed.name, schema: DomainWarningFeedSchema },
    ]),
  ],
  providers: [DomainWarningFeedRepository],
  exports: [DomainWarningFeedRepository],
})
export class DomainWarningModule {}
