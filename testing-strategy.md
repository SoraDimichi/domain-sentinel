# Domain Sentinel Testing Strategy

This document outlines the testing strategy for the domain-sentinel-chrome and domain-sentinel-webkit microservices.

## Testing Objectives

1. Verify that both microservices correctly detect deceptive website warnings
2. Ensure proper integration with Kafka for consuming domain batches
3. Validate database operations for storing warning check results
4. Test error handling and resilience
5. Measure performance and resource usage

## Testing Levels

### 1. Unit Testing

**Scope**: Individual components and services

**Components to Test**:
- Warning detector service
- Browser service
- Domain processor service
- Domain batch consumer

**Testing Approach**:
- Use Jest for unit testing
- Mock external dependencies (Playwright, Kafka, Database)
- Test each function's behavior with various inputs
- Verify error handling

**Example Test Cases**:
```typescript
// Warning detector service test
describe('WarningDetectorService', () => {
  let service: WarningDetectorService;
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      evaluate: jest.fn(),
    };
    service = new WarningDetectorService();
  });

  it('should detect warning when warning elements are present', async () => {
    mockPage.evaluate.mockResolvedValue(true);
    const result = await service.detectWarning(mockPage as any);
    expect(result).toBe(true);
  });

  it('should not detect warning when warning elements are absent', async () => {
    mockPage.evaluate.mockResolvedValue(false);
    const result = await service.detectWarning(mockPage as any);
    expect(result).toBe(false);
  });

  it('should handle errors during detection', async () => {
    mockPage.evaluate.mockRejectedValue(new Error('Test error'));
    const result = await service.detectWarning(mockPage as any);
    expect(result).toBe(false);
  });
});
```

### 2. Integration Testing

**Scope**: Interaction between components

**Components to Test**:
- Browser service with Playwright
- Domain processor with database
- Domain batch consumer with Kafka

**Testing Approach**:
- Use Jest with test containers
- Set up test databases and Kafka instances
- Test the flow from message consumption to database storage

**Example Test Cases**:
```typescript
// Domain processor integration test
describe('DomainProcessorService Integration', () => {
  let app: INestApplication;
  let service: DomainProcessorService;
  let repository: Repository<DomainWarningFeed>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'test',
          entities: [DomainWarningFeed],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([DomainWarningFeed]),
      ],
      providers: [
        DomainProcessorService,
        {
          provide: BrowserService,
          useValue: {
            checkDomain: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<DomainProcessorService>(DomainProcessorService);
    repository = moduleFixture.get<Repository<DomainWarningFeed>>(
      getRepositoryToken(DomainWarningFeed),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should process domain and save result to database', async () => {
    const browserService = moduleFixture.get<BrowserService>(BrowserService);
    browserService.checkDomain.mockResolvedValue(true);

    const domain = { id: 1, name: 'example.com', status: 'active' };
    await service.processDomain(domain);

    const result = await repository.findOne({ where: { domainId: 1 } });
    expect(result).toBeDefined();
    expect(result.hasWarning).toBe(true);
    expect(result.browserType).toBe(BrowserType.CHROME);
  });
});
```

### 3. End-to-End Testing

**Scope**: Complete system flow

**Testing Approach**:
- Use Docker Compose to set up the complete environment
- Send test messages to Kafka
- Verify database entries
- Monitor logs and performance

**Test Scenarios**:
1. **Basic Flow**: Send domain batch, verify processing and database entries
2. **Error Handling**: Send invalid domains, verify error handling
3. **Performance**: Send large batches, monitor processing time and resource usage
4. **Resilience**: Simulate component failures, verify recovery

**Example Test Script**:
```typescript
// E2E test for domain sentinel microservices
describe('Domain Sentinel E2E', () => {
  let kafkaProducer: Producer;
  let dbConnection: Connection;

  beforeAll(async () => {
    // Connect to Kafka
    kafkaProducer = new Producer({
      clientId: 'test-producer',
      brokers: ['localhost:9092'],
    });
    await kafkaProducer.connect();

    // Connect to database
    dbConnection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'domain_sentinel',
      entities: [DomainWarningFeed],
    });
  });

  afterAll(async () => {
    await kafkaProducer.disconnect();
    await dbConnection.close();
  });

  it('should process domain batch and save results', async () => {
    // Send test message to Kafka
    const message = {
      domains: [
        { id: 1, name: 'example.com', status: 'active' },
        { id: 2, name: 'test.com', status: 'active' },
      ],
      batchId: uuidv4(),
      timestamp: new Date(),
    };

    await kafkaProducer.send({
      topic: 'domain-batches',
      messages: [{ value: JSON.stringify(message) }],
    });

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify database entries
    const repository = dbConnection.getRepository(DomainWarningFeed);
    const results = await repository.find({
      where: { domainId: In([1, 2]) },
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.some((r) => r.browserType === BrowserType.CHROME)).toBe(true);
    expect(results.some((r) => r.browserType === BrowserType.WEBKIT)).toBe(true);
  });
});
```

## Test Data

### 1. Safe Domains
- example.com
- google.com
- microsoft.com

### 2. Domains with Known Warnings
- test-deceptive-site.example.com (simulated)
- malware-test.example.org (simulated)

### 3. Edge Cases
- Non-existent domains
- Domains with very long load times
- Domains with redirects
- Internationalized domain names

## Test Environment

### Local Development
- Docker Compose with all required services
- Mock browser for faster testing

### CI/CD Pipeline
- Automated tests on pull requests
- Integration tests in staging environment
- Performance tests with realistic load

### Production-like Environment
- Full deployment with all components
- Real-world domain samples
- Performance monitoring

## Performance Testing

### Metrics to Measure
- Domain processing time
- Browser startup time
- Memory usage per domain check
- CPU usage during checks
- Throughput (domains processed per minute)

### Load Testing Scenarios
1. **Normal Load**: 100 domains per batch
2. **High Load**: 1000 domains per batch
3. **Sustained Load**: Continuous processing for 24 hours

## Security Testing

1. Check for proper handling of malicious domains
2. Verify isolation of browser contexts
3. Test for memory leaks in long-running processes
4. Validate input sanitization

## Monitoring During Tests

1. CPU and memory usage
2. Kafka consumer lag
3. Database connection pool
4. Error rates and types
5. Processing time distribution

## Test Automation

1. Automated unit tests on each commit
2. Integration tests in CI pipeline
3. Nightly end-to-end tests
4. Weekly performance tests

## Test Reporting

1. Test coverage reports
2. Performance benchmark reports
3. Error trend analysis
4. Visual reports for stakeholders

## Conclusion

This testing strategy provides a comprehensive approach to ensuring the quality and reliability of the domain sentinel microservices. By implementing tests at multiple levels and focusing on both functional correctness and performance, we can deliver robust microservices that reliably detect deceptive website warnings.

The strategy emphasizes automation, realistic test scenarios, and thorough validation of all components, ensuring that the microservices will perform well in production.
