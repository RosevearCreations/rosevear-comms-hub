import { seedDb } from '../data/seedData';
import type {
  BrandId,
  Contact,
  Conversation,
  ConversationStatus,
  FollowUpTask,
  HubDatabase,
  IntakeRequest,
  ManualLeadInput,
  Message
} from '../types';

const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY ?? 'rosevear-comms-hub:v1';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
}

function isHubDatabase(value: unknown): value is HubDatabase {
  if (!value || typeof value !== 'object') return false;
  const db = value as Partial<HubDatabase>;
  return (
    Array.isArray(db.contacts) &&
    Array.isArray(db.conversations) &&
    Array.isArray(db.messages) &&
    Array.isArray(db.followUpTasks) &&
    Array.isArray(db.intakeRequests) &&
    Array.isArray(db.auditEvents)
  );
}

export function loadHubDb(): HubDatabase {
  if (typeof window === 'undefined') return clone(seedDb);

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initial = clone(seedDb);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(stored) as unknown;
    return isHubDatabase(parsed) ? parsed : clone(seedDb);
  } catch {
    return clone(seedDb);
  }
}

export function saveHubDb(db: HubDatabase): HubDatabase {
  const next = clone(db);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function resetHubDb(): HubDatabase {
  const next = clone(seedDb);
  return saveHubDb(next);
}

export function exportHubDb(db: HubDatabase): string {
  return JSON.stringify(db, null, 2);
}

export function importHubDb(rawJson: string): { ok: true; db: HubDatabase } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!isHubDatabase(parsed)) {
      return { ok: false, error: 'Import failed: file does not match the QL-004 database shape.' };
    }

    return { ok: true, db: saveHubDb(parsed) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Import failed: invalid JSON.' };
  }
}

export function createManualLead(db: HubDatabase, input: ManualLeadInput): { db: HubDatabase; conversationId: string } {
  const next = clone(db);
  const createdAt = nowIso();
  const contactId = makeId('contact');
  const conversationId = makeId('conv');
  const messageId = makeId('msg');
  const intakeRequestId = makeId('intake');
  const followUpTaskId = makeId('task');
  const status = input.flags.includes('needs_photos')
    ? 'needs_photos'
    : input.flags.includes('needs_reference_photos')
      ? 'needs_reference_photos'
      : 'new';

  next.contacts.push({
    id: contactId,
    primaryBrand: input.brandId,
    name: input.name || 'Unnamed lead',
    phone: input.phone || undefined,
    email: input.email || undefined,
    town: input.town || undefined,
    customerType: 'lead',
    source: 'manual_admin_entry',
    createdAt,
    updatedAt: createdAt
  });

  next.conversations.push({
    id: conversationId,
    brandId: input.brandId,
    contactId,
    sourceChannel: 'manual',
    status,
    priority: input.flags.includes('missed_call') ? 'high' : 'normal',
    subject: input.subject || 'Manual lead',
    summary: input.body || 'Manual lead created in QL-004 local repository.',
    tags: input.flags,
    lastActivityAt: createdAt,
    createdAt,
    updatedAt: createdAt
  });

  next.messages.push({
    id: messageId,
    conversationId,
    direction: 'inbound',
    channel: 'manual',
    body: input.body || 'Manual lead created.',
    aiGenerated: false,
    humanApproved: true,
    createdAt
  });

  next.intakeRequests.push({
    id: intakeRequestId,
    brandId: input.brandId,
    contactId,
    conversationId,
    intakeType: input.intakeType,
    rawAnswers: {
      subject: input.subject,
      town: input.town ?? null
    },
    flags: input.flags,
    recommendedService: input.recommendedService || undefined,
    status: 'needs_review',
    createdAt,
    updatedAt: createdAt
  });

  next.followUpTasks.push({
    id: followUpTaskId,
    brandId: input.brandId,
    contactId,
    conversationId,
    title: input.flags.includes('needs_photos') || input.flags.includes('needs_reference_photos') ? 'Request photos/details before quote' : 'Review new lead',
    status: 'open',
    priority: input.flags.includes('missed_call') ? 'high' : 'normal',
    notes: 'Created automatically by the local QL-004 repository.',
    createdAt,
    updatedAt: createdAt
  });

  next.auditEvents.push({
    id: makeId('audit'),
    brandId: input.brandId,
    entityType: 'conversation',
    entityId: conversationId,
    eventType: 'manual_lead_created',
    details: `Manual lead created for ${input.name || 'Unnamed lead'}.`,
    createdAt
  });

  return { db: saveHubDb(next), conversationId };
}

export function updateConversationStatus(db: HubDatabase, conversationId: string, status: ConversationStatus): HubDatabase {
  const next = clone(db);
  const conversation = next.conversations.find((item) => item.id === conversationId);
  if (!conversation) return db;

  const updatedAt = nowIso();
  conversation.status = status;
  conversation.updatedAt = updatedAt;
  conversation.lastActivityAt = updatedAt;
  next.auditEvents.push({
    id: makeId('audit'),
    brandId: conversation.brandId,
    entityType: 'conversation',
    entityId: conversation.id,
    eventType: 'status_changed',
    details: `Status changed to ${status}.`,
    createdAt: updatedAt
  });

  return saveHubDb(next);
}

export function addInternalNote(db: HubDatabase, conversationId: string, body: string): HubDatabase {
  if (!body.trim()) return db;
  const next = clone(db);
  const conversation = next.conversations.find((item) => item.id === conversationId);
  if (!conversation) return db;

  const createdAt = nowIso();
  const message: Message = {
    id: makeId('msg'),
    conversationId,
    direction: 'internal',
    channel: 'admin_note',
    body: body.trim(),
    aiGenerated: false,
    humanApproved: true,
    createdAt
  };
  next.messages.push(message);
  conversation.lastActivityAt = createdAt;
  conversation.updatedAt = createdAt;
  next.auditEvents.push({
    id: makeId('audit'),
    brandId: conversation.brandId,
    entityType: 'message',
    entityId: message.id,
    eventType: 'internal_note_added',
    details: 'Internal note added locally.',
    createdAt
  });

  return saveHubDb(next);
}

export function createFollowUpTask(db: HubDatabase, input: Pick<FollowUpTask, 'brandId' | 'contactId' | 'conversationId' | 'title' | 'priority' | 'notes'>): HubDatabase {
  if (!input.title.trim()) return db;
  const next = clone(db);
  const createdAt = nowIso();
  next.followUpTasks.push({
    id: makeId('task'),
    brandId: input.brandId,
    contactId: input.contactId,
    conversationId: input.conversationId,
    title: input.title.trim(),
    priority: input.priority,
    notes: input.notes,
    status: 'open',
    createdAt,
    updatedAt: createdAt
  });
  next.auditEvents.push({
    id: makeId('audit'),
    brandId: input.brandId,
    entityType: 'task',
    entityId: input.conversationId ?? 'general',
    eventType: 'task_created',
    details: input.title.trim(),
    createdAt
  });
  return saveHubDb(next);
}

export function completeTask(db: HubDatabase, taskId: string): HubDatabase {
  const next = clone(db);
  const task = next.followUpTasks.find((item) => item.id === taskId);
  if (!task) return db;
  task.status = 'done';
  task.updatedAt = nowIso();
  next.auditEvents.push({
    id: makeId('audit'),
    brandId: task.brandId,
    entityType: 'task',
    entityId: task.id,
    eventType: 'task_completed',
    details: task.title,
    createdAt: task.updatedAt
  });
  return saveHubDb(next);
}

export function getContact(db: HubDatabase, contactId: string): Contact | undefined {
  return db.contacts.find((contact) => contact.id === contactId);
}

export function getContactName(db: HubDatabase, contactId: string): string {
  return getContact(db, contactId)?.name ?? 'Unknown contact';
}

export function getConversationMessages(db: HubDatabase, conversationId: string): Message[] {
  return db.messages.filter((message) => message.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getOpenTasksForBrand(db: HubDatabase, brandId: BrandId): FollowUpTask[] {
  return db.followUpTasks.filter((task) => task.brandId === brandId && task.status === 'open').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getTasksForConversation(db: HubDatabase, conversationId: string): FollowUpTask[] {
  return db.followUpTasks.filter((task) => task.conversationId === conversationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getIntakeForConversation(db: HubDatabase, conversationId: string): IntakeRequest | undefined {
  return db.intakeRequests.find((intake) => intake.conversationId === conversationId);
}

export function getContactsForBrand(db: HubDatabase, brandId: BrandId): Contact[] {
  const contactIds = new Set(db.conversations.filter((conversation) => conversation.brandId === brandId).map((conversation) => conversation.contactId));
  return db.contacts.filter((contact) => contact.primaryBrand === brandId || contactIds.has(contact.id)).sort((a, b) => a.name.localeCompare(b.name));
}

export function getIntakesForBrand(db: HubDatabase, brandId: BrandId): IntakeRequest[] {
  return db.intakeRequests.filter((intake) => intake.brandId === brandId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
