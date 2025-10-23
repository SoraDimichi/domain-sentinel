import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum BrowserType {
  CHROME = 'chrome',
  WEBKIT = 'webkit',
}

export type DomainWarningFeedDocument = DomainWarningFeed & Document;

@Schema({ timestamps: true })
export class DomainWarningFeed {
  @Prop({ required: true })
  domainId: number;

  @Prop({ required: true, default: false })
  hasWarning: boolean;

  @Prop({ required: true, enum: Object.values(BrowserType) })
  browserType: BrowserType;
}

export const DomainWarningFeedSchema = SchemaFactory.createForClass(DomainWarningFeed);
