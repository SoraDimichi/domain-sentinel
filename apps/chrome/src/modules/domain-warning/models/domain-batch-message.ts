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
