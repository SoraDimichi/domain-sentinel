import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BrowserType, DomainWarningFeed, DomainWarningFeedDocument } from '../models/domain-warning-feed.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DomainWarningFeedRepository {
  private readonly browserType: BrowserType;

  constructor(
    @InjectModel(DomainWarningFeed.name)
    private readonly domainWarningFeedModel: Model<DomainWarningFeedDocument>,
    private readonly configService: ConfigService,
  ) {
    this.browserType = this.configService.get<BrowserType>('BROWSER_TYPE') || BrowserType.CHROME;
  }

  async upsert(domainId: number, hasWarning: boolean): Promise<DomainWarningFeed> {
    return this.domainWarningFeedModel
      .findOneAndUpdate(
        { domainId, browserType: this.browserType },
        { domainId, hasWarning, browserType: this.browserType },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findByDomainId(domainId: number): Promise<DomainWarningFeed | null> {
    return this.domainWarningFeedModel.findOne({ domainId, browserType: this.browserType }).exec();
  }
}
