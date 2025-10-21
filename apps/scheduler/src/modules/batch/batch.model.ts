import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

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

export const createDomainBatchMessage = (params: {
  domains: Array<{
    id: number;
    name: string;
    status: 'active' | 'inactive' | 'pending';
  }>;
}): DomainBatchMessage => {
  return {
    domains: params.domains,
    batchId: uuidv4(),
    timestamp: new Date(),
  };
};
