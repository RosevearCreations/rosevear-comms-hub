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

export type SourceChannel =
  | 'manual'
  | 'website_form'
  | 'phone_call'
  | 'missed_call'
  | 'voicemail'
  | 'sms'
  | 'email'
  | 'system_task';

export type TaskStatus = 'open' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high';
export type MessageDirection = 'inbound' | 'outbound' | 'internal';

export interface BrandConfig {
  id: BrandId;
  displayName: string;
  businessType: string;
  firstWorkflow: string;
  accentLabel: string;
  statuses: ConversationStatus[];
  intakeTypes: string[];
  defaultTags: string[];
}

export interface Contact {
  id: string;
  primaryBrand: BrandId;
  name: string;
  phone?: string;
  email?: string;
  town?: string;
  customerType: 'lead' | 'customer' | 'vendor' | 'unknown';
  source: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  brandId: BrandId;
  contactId: string;
  sourceChannel: SourceChannel;
  status: ConversationStatus;
  priority: TaskPriority;
  subject: string;
  summary: string;
  tags: string[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  channel: SourceChannel | 'admin_note';
  body: string;
  aiGenerated: boolean;
  humanApproved: boolean;
  createdAt: string;
}

export interface FollowUpTask {
  id: string;
  brandId: BrandId;
  contactId?: string;
  conversationId?: string;
  title: string;
  dueAt?: string;
  status: TaskStatus;
  priority: TaskPriority;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeRequest {
  id: string;
  brandId: BrandId;
  contactId: string;
  conversationId: string;
  intakeType: string;
  rawAnswers: Record<string, string | string[] | boolean | number | null>;
  flags: string[];
  recommendedService?: string;
  status: 'draft' | 'needs_review' | 'quoted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  brandId?: BrandId;
  entityType: string;
  entityId: string;
  eventType: string;
  details: string;
  createdAt: string;
}

export interface HubDatabase {
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  followUpTasks: FollowUpTask[];
  intakeRequests: IntakeRequest[];
  auditEvents: AuditEvent[];
}

export interface ManualLeadInput {
  brandId: BrandId;
  name: string;
  phone?: string;
  email?: string;
  town?: string;
  subject: string;
  body: string;
  intakeType: string;
  flags: string[];
  recommendedService?: string;
}
