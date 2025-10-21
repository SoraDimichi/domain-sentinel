import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DomainDocument = Domain & Document;

@Schema({ timestamps: true })
export class Domain {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: true })
  is_ssl: boolean;

  @Prop({ required: true, enum: ['active', 'inactive', 'pending'] })
  network_status: string;

  @Prop({ required: true, default: 0 })
  default_campaign_id: number;

  @Prop({ required: true, enum: ['active', 'inactive', 'pending'] })
  state: string;

  @Prop({ required: true })
  created_at: Date;

  @Prop({ required: true })
  updated_at: Date;

  @Prop({ required: true, default: false })
  catch_not_found: boolean;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: '' })
  error_description: string;

  @Prop({ required: true, enum: ['issued', 'pending', 'failed'] })
  ssl_status: string;

  @Prop({ type: Object, default: null })
  ssl_data: any;

  @Prop({ required: true })
  next_check_at: Date;

  @Prop({ required: true, default: true })
  ssl_redirect: boolean;

  @Prop({ required: true, default: false })
  allow_indexing: boolean;

  @Prop({ required: true, default: 3 })
  check_retries: number;

  @Prop({ required: true })
  group_id: number;

  @Prop({ required: true, default: false })
  admin_dashboard: boolean;

  @Prop({ default: '' })
  registrar: string;

  @Prop({ default: '' })
  external_id: string;

  @Prop({ required: true, default: true })
  cloudflare_proxy: boolean;

  @Prop({ default: '' })
  cloudflare_id: string;

  @Prop({ default: '' })
  dns_provider: string;

  @Prop({ required: true, default: 0 })
  campaigns_count: number;

  @Prop({ default: '' })
  default_campaign: string;

  @Prop({ default: '' })
  group: string;

  @Prop({ default: '' })
  error_solution: string;

  @Prop({ required: true, enum: ['active', 'inactive', 'pending'] })
  status: string;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);

import { z } from 'zod';

export const domainSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string(),
    network_status: z.enum(['active', 'inactive', 'pending']),
    default_campaign_id: z.number().int(),
    state: z.enum(['active', 'inactive', 'pending']),
    catch_not_found: z.boolean(),
    is_ssl: z.boolean(),
    notes: z.string(),
    error_description: z.string(),
    ssl_status: z.enum(['issued', 'pending', 'failed']),
    ssl_data: z.any().nullable(),
    ssl_redirect: z.boolean(),
    allow_indexing: z.boolean(),
    check_retries: z.number().int(),
    group_id: z.number().int(),
    admin_dashboard: z.boolean(),
    registrar: z.string(),
    external_id: z.string(),
    cloudflare_proxy: z.boolean(),
    cloudflare_id: z.string(),
    dns_provider: z.string(),
    campaigns_count: z.number().int(),
    default_campaign: z.string(),
    group: z.string(),
    error_solution: z.string(),
    status: z.enum(['active', 'inactive', 'pending']),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    next_check_at: z.coerce.date(),
  })
  .strict();

export type DomainData = z.infer<typeof domainSchema>;
