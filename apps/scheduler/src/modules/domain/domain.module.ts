import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Domain, DomainSchema } from './domain.schema';
import { DomainService } from './domain.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Domain.name, schema: DomainSchema }
    ])
  ],
  providers: [DomainService],
  exports: [DomainService]
})
export class DomainModule {}
