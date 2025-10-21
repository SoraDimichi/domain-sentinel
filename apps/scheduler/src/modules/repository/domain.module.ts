import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Domain, DomainSchema } from './domain.schema';
import { DomainRepository } from './domain.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Domain.name, schema: DomainSchema }])],
  providers: [DomainRepository],
  exports: [DomainRepository],
})
export class DomainRepositoryModule {}
