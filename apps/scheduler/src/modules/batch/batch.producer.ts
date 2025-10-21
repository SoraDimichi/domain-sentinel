import { Injectable, OnModuleDestroy, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DomainBatchMessage } from './batch.model';

@Injectable()
export class DomainBatchProducer implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject('DOMAIN_BATCH_SERVICE') private readonly client: ClientProxy) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  public async sendMessage(message: DomainBatchMessage) {
    this.client.emit('domain-batches', message);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }
}
