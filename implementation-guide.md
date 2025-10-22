# Domain Sentinel Implementation Guide

This guide provides step-by-step instructions for implementing the domain-sentinel-chrome and domain-sentinel-webkit microservices as outlined in the architecture plan.

## 1. Create Feed Schema

First, create a migration file for the domain warning feed schema:

```typescript
// apps/updater/src/migrations/1684654321002-CreateDomainWarningFeedTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDomainWarningFeedTable1684654321002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'domain_warning_feed',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'domain_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'has_warning',
            type: 'boolean',
            default: false,
          },
          {
            name: 'browser_type',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('domain_warning_feed');
  }
}
```

Then create the entity file:

```typescript
// apps/domain-sentinel-chrome/src/models/domain-warning-feed.entity.ts
// apps/domain-sentinel-webkit/src/models/domain-warning-feed.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BrowserType {
  CHROME = 'chrome',
  WEBKIT = 'webkit',
}

@Entity('domain_warning_feed')
export class DomainWarningFeed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'domain_id', type: 'int' })
  domainId: number;

  @Column({ name: 'has_warning', type: 'boolean', default: false })
  hasWarning: boolean;

  @Column({
    name: 'browser_type',
    type: 'enum',
    enum: BrowserType,
  })
  browserType: BrowserType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

## 2. Set Up Microservice Structure

### Create Directory Structure

Create the following directory structure for both microservices:

```
apps/domain-sentinel-chrome/
apps/domain-sentinel-webkit/
```

### Package.json Updates

Add the following dependencies to your package.json:

```json
{
  "dependencies": {
    "playwright": "^1.40.0",
    "nestjs-playwright": "^0.0.1"
  }
}
```

### NestJS Module Configuration

Create the main module file for each microservice:

```typescript
// apps/domain-sentinel-chrome/src/domain-sentinel.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaywrightModule } from 'nestjs-playwright';
import { DomainWarningFeed } from './models/domain-warning-feed.entity';
import { DomainBatchConsumer } from './domain-batch.consumer';
import { BrowserService } from './services/browser.service';
import { DomainProcessorService } from './services/domain-processor.service';
import { WarningDetectorService } from './services/warning-detector.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'domain_sentinel'),
        entities: [DomainWarningFeed],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([DomainWarningFeed]),
    ClientsModule.registerAsync([
      {
        name: 'DOMAIN_BATCH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'domain-sentinel-chrome',
              brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
            },
            consumer: {
              groupId: 'domain-sentinel-chrome-consumer',
            },
          },
        }),
      },
    ]),
    PlaywrightModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [DomainBatchConsumer],
  providers: [BrowserService, DomainProcessorService, WarningDetectorService],
})
export class DomainSentinelModule {}
```

For the WebKit microservice, make similar changes but update the clientId and groupId to 'domain-sentinel-webkit'.

### Main Entry Point

Create the main.ts file for each microservice:

```typescript
// apps/domain-sentinel-chrome/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DomainSentinelModule } from './domain-sentinel.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(DomainSentinelModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Main');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'domain-sentinel-chrome',
        brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
      },
      consumer: {
        groupId: 'domain-sentinel-chrome-consumer',
        allowAutoTopicCreation: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3001);
  logger.log('Domain Sentinel Chrome microservice is running');
}

bootstrap();
```

For the WebKit microservice, make similar changes but update the clientId, groupId, and port to 3002.

## 3. Implement Domain Batch Consumer

Create the domain batch consumer for each microservice:

```typescript
// apps/domain-sentinel-chrome/src/domain-batch.consumer.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DomainProcessorService } from './services/domain-processor.service';
import { domainBatchMessageSchema } from './models/domain-batch-message';

@Controller()
export class DomainBatchConsumer {
  private readonly logger = new Logger(DomainBatchConsumer.name);

  constructor(
    private readonly domainProcessorService: DomainProcessorService,
  ) {}

  @MessagePattern('domain-batches')
  async handleDomainBatch(@Payload() message: unknown) {
    const parsedMessage = domainBatchMessageSchema.parse(message);
    this.logger.log(
      `Received domain batch with ID: ${parsedMessage.batchId}, timestamp: ${parsedMessage.timestamp}`,
    );

    // Process each domain individually
    for (const domain of parsedMessage.domains) {
      await this.domainProcessorService.processDomain(domain);
    }

    this.logger.log(`Successfully processed domain batch`);
  }
}
```

Create the domain batch message schema:

```typescript
// apps/domain-sentinel-chrome/src/models/domain-batch-message.ts
// apps/domain-sentinel-webkit/src/models/domain-batch-message.ts
import { z } from 'zod';

export const domainBatchMessageSchema = z.object({
  domains: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string().min(1),
      status: z.enum(['active', 'inactive', 'pending']),
    }),
  ),
  batchId: z.string().uuid(),
  timestamp: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export type DomainBatchMessage = z.infer<typeof domainBatchMessageSchema>;
```

## 4. Implement Browser Service

Create the browser service for the Chrome microservice:

```typescript
// apps/domain-sentinel-chrome/src/services/browser.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectPlaywright } from 'nestjs-playwright';
import { Browser, Playwright } from 'playwright';
import { WarningDetectorService } from './warning-detector.service';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser;

  constructor(
    @InjectPlaywright() private readonly playwright: Playwright,
    private readonly warningDetectorService: WarningDetectorService,
  ) {}

  async onModuleInit() {
    this.browser = await this.playwright.chromium.launch({
      headless: true,
    });
    this.logger.log('Chrome browser launched');
  }

  async checkDomain(domainName: string): Promise<boolean> {
    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      // Navigate to the domain
      this.logger.log(`Checking domain: ${domainName}`);
      await page.goto(`https://${domainName}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Check for deceptive website warnings
      const hasWarning = await this.warningDetectorService.detectWarning(page);

      await context.close();
      return hasWarning;
    } catch (error) {
      this.logger.error(`Error checking domain ${domainName}: ${error.message}`);
      await context.close();
      return false;
    }
  }

  async onModuleDestroy() {
    await this.browser.close();
    this.logger.log('Chrome browser closed');
  }
}
```

For the WebKit microservice, create a similar service but use webkit instead of chromium:

```typescript
// apps/domain-sentinel-webkit/src/services/browser.service.ts
// ...
async onModuleInit() {
  this.browser = await this.playwright.webkit.launch({
    headless: true,
  });
  this.logger.log('WebKit browser launched');
}
// ...
```

## 5. Implement Warning Detector Service

Create the warning detector service for the Chrome microservice:

```typescript
// apps/domain-sentinel-chrome/src/services/warning-detector.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'playwright';

@Injectable()
export class WarningDetectorService {
  private readonly logger = new Logger(WarningDetectorService.name);

  async detectWarning(page: Page): Promise<boolean> {
    try {
      // Check for common deceptive website warning indicators in Chrome
      const hasWarning = await page.evaluate(() => {
        // Check for Chrome security warning page elements
        return document.querySelector('.interstitial-wrapper') !== null ||
               document.querySelector('.icon-generic') !== null ||
               document.title.includes('Security') ||
               document.body.textContent.includes('deceptive site');
      });

      if (hasWarning) {
        this.logger.log('Deceptive website warning detected');
      } else {
        this.logger.log('No warning detected');
      }

      return hasWarning;
    } catch (error) {
      this.logger.error(`Error detecting warning: ${error.message}`);
      return false;
    }
  }
}
```

For the WebKit microservice, create a similar service but adjust the selectors for WebKit:

```typescript
// apps/domain-sentinel-webkit/src/services/warning-detector.service.ts
// ...
const hasWarning = await page.evaluate(() => {
  // Check for WebKit security warning page elements
  return document.querySelector('.warning-message') !== null ||
         document.title.includes('Warning') ||
         document.body.textContent.includes('deceptive site');
});
// ...
```

## 6. Implement Domain Processor Service

Create the domain processor service for the Chrome microservice:

```typescript
// apps/domain-sentinel-chrome/src/services/domain-processor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainWarningFeed, BrowserType } from '../models/domain-warning-feed.entity';
import { BrowserService } from './browser.service';

@Injectable()
export class DomainProcessorService {
  private readonly logger = new Logger(DomainProcessorService.name);

  constructor(
    @InjectRepository(DomainWarningFeed)
    private readonly feedRepository: Repository<DomainWarningFeed>,
    private readonly browserService: BrowserService,
  ) {}

  async processDomain(domain: { id: number; name: string; status: string }): Promise<void> {
    this.logger.log(`Processing domain: ${domain.name} (ID: ${domain.id})`);

    try {
      // Check if domain has a warning
      const hasWarning = await this.browserService.checkDomain(domain.name);

      // Save result to feed schema
      await this.feedRepository.save({
        domainId: domain.id,
        hasWarning: hasWarning,
        browserType: BrowserType.CHROME,
      });

      this.logger.log(`Domain ${domain.name} processed: ${hasWarning ? 'Warning detected' : 'No warning'}`);
    } catch (error) {
      this.logger.error(`Error processing domain ${domain.name}: ${error.message}`);

      // Save error result
      await this.feedRepository.save({
        domainId: domain.id,
        hasWarning: false,
        browserType: BrowserType.CHROME,
      });
    }
  }
}
```

For the WebKit microservice, create a similar service but use BrowserType.WEBKIT instead.

## 7. Create Dockerfiles

Create a Dockerfile for the Chrome microservice:

```dockerfile
# apps/domain-sentinel-chrome/Dockerfile
FROM node:18-slim

# Install dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libwayland-client0

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build domain-sentinel-chrome

# Install only Chromium browser
RUN npx playwright install chromium

CMD ["node", "dist/apps/domain-sentinel-chrome/main"]
```

Create a Dockerfile for the WebKit microservice:

```dockerfile
# apps/domain-sentinel-webkit/Dockerfile
FROM node:18-slim

# Install dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libwayland-client0

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build domain-sentinel-webkit

# Install only WebKit browser
RUN npx playwright install webkit

CMD ["node", "dist/apps/domain-sentinel-webkit/main"]
```

## 8. Update Docker Compose

Update the docker-compose.yml file to include the new microservices:

```yaml
# Add to existing docker-compose.yml
  domain-sentinel-chrome:
    build:
      context: .
      dockerfile: apps/domain-sentinel-chrome/Dockerfile
    depends_on:
      - kafka
      - postgres
    environment:
      - KAFKA_BROKERS=kafka:9092
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_USERNAME=postgres
      - DATABASE_PASSWORD=postgres
      - DATABASE_NAME=domain_sentinel

  domain-sentinel-webkit:
    build:
      context: .
      dockerfile: apps/domain-sentinel-webkit/Dockerfile
    depends_on:
      - kafka
      - postgres
    environment:
      - KAFKA_BROKERS=kafka:9092
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_USERNAME=postgres
      - DATABASE_PASSWORD=postgres
      - DATABASE_NAME=domain_sentinel
```

## 9. Update nest-cli.json

Update the nest-cli.json file to include the new microservices:

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/scheduler/src",
  "monorepo": true,
  "root": "apps/scheduler",
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "apps/scheduler/tsconfig.app.json"
  },
  "projects": {
    "scheduler": {
      "type": "application",
      "root": "apps/scheduler",
      "entryFile": "main",
      "sourceRoot": "apps/scheduler/src",
      "compilerOptions": {
        "tsConfigPath": "apps/scheduler/tsconfig.app.json"
      }
    },
    "updater": {
      "type": "application",
      "root": "apps/updater",
      "entryFile": "main",
      "sourceRoot": "apps/updater/src",
      "compilerOptions": {
        "tsConfigPath": "apps/updater/tsconfig.app.json"
      }
    },
    "domain-sentinel-chrome": {
      "type": "application",
      "root": "apps/domain-sentinel-chrome",
      "entryFile": "main",
      "sourceRoot": "apps/domain-sentinel-chrome/src",
      "compilerOptions": {
        "tsConfigPath": "apps/domain-sentinel-chrome/tsconfig.app.json"
      }
    },
    "domain-sentinel-webkit": {
      "type": "application",
      "root": "apps/domain-sentinel-webkit",
      "entryFile": "main",
      "sourceRoot": "apps/domain-sentinel-webkit/src",
      "compilerOptions": {
        "tsConfigPath": "apps/domain-sentinel-webkit/tsconfig.app.json"
      }
    }
  }
}
```

## 10. Create tsconfig.app.json for Each Microservice

Create tsconfig.app.json for the Chrome microservice:

```json
// apps/domain-sentinel-chrome/tsconfig.app.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": false,
    "outDir": "../../dist/apps/domain-sentinel-chrome"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

Create tsconfig.app.json for the WebKit microservice:

```json
// apps/domain-sentinel-webkit/tsconfig.app.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": false,
    "outDir": "../../dist/apps/domain-sentinel-webkit"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

## 11. Testing

To test the microservices, you can:

1. Run the migration to create the domain_warning_feed table
2. Start the microservices using docker-compose
3. Send test domain batches to the Kafka topic
4. Check the logs to see if the domains are being processed
5. Query the database to see the results

## 12. Conclusion

Following this implementation guide, you will have two microservices that:

1. Consume domain batches from a Kafka topic
2. Check each domain for deceptive website warnings using Playwright with Chrome and WebKit
3. Save the results to a feed schema

The microservices are designed to be scalable and can be deployed independently.
