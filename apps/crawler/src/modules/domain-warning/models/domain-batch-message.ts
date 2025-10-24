export interface DomainBatchMessage {
  domains: {
    id: number;
    name: string;
    status: string;
  }[];
  correlationId: string;
}
