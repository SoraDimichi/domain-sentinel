import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DomainWarningFeed, DomainWarningFeedDocument, BrowserType } from '../models/domain-warning-feed.entity';

@Injectable()
export class DomainWarningFeedRepository {
  private readonly logger = new Logger(DomainWarningFeedRepository.name);

  constructor(@InjectModel(DomainWarningFeed.name) private domainWarningFeedModel: Model<DomainWarningFeedDocument>) {}

  async findByDomainId(domainId: number): Promise<DomainWarningFeed | null> {
    return this.domainWarningFeedModel
      .findOne({
        domainId,
        browserType: BrowserType.CHROME,
      })
      .exec();
  }

  async findAll(options?: { skip?: number; limit?: number }): Promise<DomainWarningFeed[]> {
    let query = this.domainWarningFeedModel.find({ browserType: BrowserType.CHROME });

    if (options?.skip !== undefined) {
      query = query.skip(options.skip);
    }

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    return query.exec();
  }

  async create(data: Partial<DomainWarningFeed>): Promise<DomainWarningFeed> {
    const entity = new this.domainWarningFeedModel({
      ...data,
      browserType: BrowserType.CHROME,
    });
    return entity.save();
  }

  async update(domainId: number, data: Partial<DomainWarningFeed>): Promise<DomainWarningFeed | null> {
    return this.domainWarningFeedModel
      .findOneAndUpdate({ domainId, browserType: BrowserType.CHROME }, data, { new: true })
      .exec();
  }

  async upsert(domainId: number, hasWarning: boolean): Promise<DomainWarningFeed> {
    const update = {
      domainId,
      hasWarning,
      browserType: BrowserType.CHROME,
    };

    return this.domainWarningFeedModel
      .findOneAndUpdate({ domainId, browserType: BrowserType.CHROME }, update, { new: true, upsert: true })
      .exec();
  }

  async remove(domainId: number): Promise<DomainWarningFeed | null> {
    return this.domainWarningFeedModel
      .findOneAndDelete({
        domainId,
        browserType: BrowserType.CHROME,
      })
      .exec();
  }
}
