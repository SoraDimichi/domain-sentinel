import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Domain, DomainData, DomainDocument } from './domain.schema';

@Injectable()
export class DomainRepository {
  private readonly logger = new Logger(DomainRepository.name);

  constructor(@InjectModel(Domain.name) private domainModel: Model<DomainDocument>) {}

  async findAll(options?: { skip?: number; limit?: number }): Promise<Domain[]> {
    let query = this.domainModel.find();

    if (options?.skip !== undefined) {
      query = query.skip(options.skip);
    }

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    return query.exec();
  }

  async count(): Promise<number> {
    return this.domainModel.countDocuments().exec();
  }

  async findOne(id: number): Promise<Domain | null> {
    return this.domainModel.findOne({ id }).exec();
  }

  async findByName(name: string): Promise<Domain | null> {
    return this.domainModel.findOne({ name }).exec();
  }

  async getAllDomainIds(): Promise<number[]> {
    const domains = await this.domainModel.find({}, { id: 1, _id: 0 }).exec();
    return domains.map((domain) => domain.id);
  }

  async create(domainData: DomainData): Promise<Domain> {
    const createdDomain = new this.domainModel(domainData);
    return createdDomain.save();
  }

  async bulkCreate(domainsData: DomainData[]): Promise<number> {
    if (!domainsData.length) return 0;

    try {
      const result = await this.domainModel.insertMany(domainsData, { ordered: false });
      return result.length;
    } catch (error) {
      this.logger.error(`Error in bulkCreate: ${error.message}`);
      // If some documents were inserted before the error, return that count
      return error.insertedDocs?.length || 0;
    }
  }

  async update(id: number, domainData: DomainData): Promise<Domain | null> {
    return this.domainModel.findOneAndUpdate({ id }, domainData, { new: true }).exec();
  }

  async bulkUpdate(domainsData: DomainData[]): Promise<number> {
    if (!domainsData.length) return 0;

    let updatedCount = 0;

    try {
      const bulkOps = domainsData.map((domain) => ({
        updateOne: {
          filter: { id: domain.id },
          update: { $set: domain },
        },
      }));

      const result = await this.domainModel.bulkWrite(bulkOps);
      updatedCount = result.modifiedCount;
    } catch (error) {
      this.logger.error(`Error in bulkUpdate: ${error.message}`);
    }

    return updatedCount;
  }

  async remove(id: number): Promise<Domain | null> {
    return this.domainModel.findOneAndDelete({ id }).exec();
  }

  async bulkRemove(ids: number[]): Promise<number> {
    if (!ids.length) return 0;

    try {
      const result = await this.domainModel.deleteMany({ id: { $in: ids } });
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Error in bulkRemove: ${error.message}`);
      return 0;
    }
  }
}
