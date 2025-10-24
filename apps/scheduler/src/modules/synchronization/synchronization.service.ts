import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientProvider } from './http-client.provider';
import { DomainRepository } from '../repository/domain.repository';
import { z } from 'zod';
import { DomainData, domainSchema } from '../repository/domain.schema';

const domainsApiResponseSchema = z.array(domainSchema);

@Injectable()
export class SynchronizationService {
  private readonly logger = new Logger(SynchronizationService.name);
  private readonly apiKey: string;
  private readonly apiEndpoint: string;
  private lastSuccessfulFetch: DomainData[] = [];

  constructor(
    private readonly httpClient: HttpClientProvider,
    private readonly repository: DomainRepository,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('scheduler.apiKey') || 'api-key';
    this.apiEndpoint = this.configService.get<string>('scheduler.apiEndpoint') || 'https://hor.info/admin_api/v1/domains';
  }

  async fetchDomains(): Promise<void> {
    try {
      this.logger.log('Fetching domains from API...');

      const domains = await this.httpClient.query(this.apiEndpoint, domainsApiResponseSchema, { api_key: this.apiKey });

      this.logger.log(`Successfully fetched ${domains.length} domains from API`);

      this.lastSuccessfulFetch = [...domains];

      await this.syncDomainsWithDatabase(domains);
    } catch (error) {
      this.logger.error(`Failed to fetch domains from API: ${error.message}`, error.stack);

      if (this.lastSuccessfulFetch.length > 0) {
        this.logger.log(`Using last successful fetch data (${this.lastSuccessfulFetch.length} domains) as fallback`);
        await this.syncDomainsWithDatabase(this.lastSuccessfulFetch);
      } else {
        this.logger.warn('No fallback data available. Database will not be updated.');
      }
    }
  }

  private async syncWithApiData(apiDomains: DomainData[]): Promise<{ created: number; updated: number; removed: number }> {
    const existingIds = await this.repository.getAllDomainIds();

    const apiIds = apiDomains.map((domain) => domain.id);

    const domainsToCreate = apiDomains.filter((domain) => !existingIds.includes(domain.id));
    const domainsToUpdate = apiDomains.filter((domain) => existingIds.includes(domain.id));
    const idsToRemove = existingIds.filter((id) => !apiIds.includes(id));

    const created = await this.repository.bulkCreate(domainsToCreate);
    const updated = await this.repository.bulkUpdate(domainsToUpdate);
    const removed = await this.repository.bulkRemove(idsToRemove);

    return { created, updated, removed };
  }

  private async syncDomainsWithDatabase(domains: DomainData[]): Promise<void> {
    try {
      const result = await this.syncWithApiData(domains);

      this.logger.log(
        `Domain synchronization completed: ${result.created} created, ${result.updated} updated, ${result.removed} removed`,
      );
    } catch (error) {
      this.logger.error(`Error synchronizing domains with database: ${error.message}`, error.stack);
    }
  }
}
