import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Domain, DomainData, DomainDocument } from './domain.schema';

@Injectable()
export class DomainService {
  constructor(@InjectModel(Domain.name) private domainModel: Model<DomainDocument>) {}

  async findAll(): Promise<Domain[]> {
    return this.domainModel.find().exec();
  }

  async findOne(id: number): Promise<Domain | null> {
    return this.domainModel.findOne({ id }).exec();
  }

  async findByName(name: string): Promise<Domain | null> {
    return this.domainModel.findOne({ name }).exec();
  }

  async create(domainData: DomainData): Promise<Domain> {
    const createdDomain = new this.domainModel(domainData);
    return createdDomain.save();
  }

  async update(id: number, domainData: DomainData): Promise<Domain | null> {
    return this.domainModel.findOneAndUpdate({ id }, domainData, { new: true }).exec();
  }

  async remove(id: number): Promise<Domain | null> {
    return this.domainModel.findOneAndDelete({ id }).exec();
  }
}
