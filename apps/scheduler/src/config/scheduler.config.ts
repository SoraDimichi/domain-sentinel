import { registerAs } from '@nestjs/config';

export const getSchedulerConfig = registerAs('scheduler', () => {
  return {
    batchSize: parseInt(process.env.BATCH_SIZE || '10', 10),
    cronExpression: process.env.PRICE_UPDATE_CRON || '*/10 * * * *',
    enabled: process.env.PRICE_UPDATE_ENABLED === 'true',
    apiKey: process.env.API_KEY || 'api-key',
    apiEndpoint: process.env.API_ENDPOINT || 'https://hor.info/admin_api/v1/domains',
  };
});
