export type BrandId = 'rosiedazzlers' | 'devilndove';

export type ConversationStatus =
  | 'new'
  | 'needs_reply'
  | 'waiting_on_customer'
  | 'needs_photos'
  | 'needs_reference_photos'
  | 'quote_needed'
  | 'quote_sent'
  | 'booked'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'archived';

export type Channel = 'website' | 'manual' | 'phone_placeholder' | 'sms_placeholder' | 'email_placeholder';

export interface BrandConfig {
  id: BrandId;
  displayName: string;
  shortName: string;
  businessType: string;
  firstWorkflow: string;
  accentLabel: string;
  primaryCta: string;
  intakeTypes: string[];
}

export interface Conversation {
  id: string;
  brandId: BrandId;
  customerName: string;
  channel: Channel;
  status: ConversationStatus;
  title: string;
  summary: string;
  tags: string[];
  lastActivity: string;
  nextAction: string;
  valueHint: 'unknown' | 'low' | 'medium' | 'high';
}
