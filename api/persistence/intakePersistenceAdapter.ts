// QL-014 Intake Persistence Adapter Draft
//
// Converts a validated website intake payload into the exact server-side records
// the hub should create later. This module is intentionally provider-neutral:
// it does not import Supabase, does not use browser credentials, and does not
// enable public anonymous table writes.

import type { WebsiteIntakePayload } from '../../integrations/website-intake/websiteIntakeContract';

export type IntakePersistenceMode = 'disabled' | 'dry_run' | 'stored';

export interface IntakePersistenceEnvironment {
  ENABLE_INTAKE_PERSISTENCE?: string;
}

export interface IntakePersistenceRecordSet {
  contact: Record<string, unknown>;
  contactBrandProfile: Record<string, unknown>;
  conversation: Record<string, unknown>;
  message: Record<string, unknown>;
  intakeRequest: Record<string, unknown>;
  followUpTask: Record<string, unknown>;
  auditEvent: Record<string, unknown>;
}

export interface IntakePersistencePlan {
  mode: IntakePersistenceMode;
  records: IntakePersistenceRecordSet;
  warnings: string[];
}

export interface IntakePersistenceResult {
  mode: IntakePersistenceMode;
  intakeId?: string;
  conversationId?: string;
  taskId?: string;
  warnings: string[];
}

export interface IntakePersistenceRepository {
  createContact(record: Record<string, unknown>): Promise<{ id: string }>;
  createContactBrandProfile(record: Record<string, unknown>): Promise<{ id: string }>;
  createConversation(record: Record<string, unknown>): Promise<{ id: string }>;
  createMessage(record: Record<string, unknown>): Promise<{ id: string }>;
  createIntakeRequest(record: Record<string, unknown>): Promise<{ id: string }>;
  createFollowUpTask(record: Record<string, unknown>): Promise<{ id: string }>;
  createAuditEvent(record: Record<string, unknown>): Promise<{ id: string }>;
}

export interface IntakePersistenceDependencies {
  repository?: IntakePersistenceRepository;
  now?: () => string;
  createId?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  return cryptoApi?.randomUUID?.() ?? `draft_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function normalizeEmail(value?: string): string | null {
  const clean = value?.trim().toLowerCase() ?? '';
  return clean || null;
}

function normalizeNullable(value?: string): string | null {
  const clean = value?.trim() ?? '';
  return clean || null;
}

function chooseStatus(payload: WebsiteIntakePayload): string {
  if (payload.attachments?.length) return 'needs_reply';
  if (payload.request.flags?.some((flag) => flag.includes('photo'))) return 'needs_photos';
  return 'new';
}

function choosePriority(payload: WebsiteIntakePayload): string {
  const flags = payload.request.flags ?? [];
  const urgentSignals = ['gift_deadline', 'fleet_commercial', 'ceramic_coating', 'paint_correction', 'missed_call'];
  return flags.some((flag) => urgentSignals.includes(flag)) ? 'high' : 'normal';
}

function makeFollowUpTitle(payload: WebsiteIntakePayload): string {
  if (payload.brand === 'rosiedazzlers') {
    return `Review detailing intake: ${payload.request.subject}`;
  }

  return `Review DevilnDove intake: ${payload.request.subject}`;
}

export function mapWebsiteIntakeToPersistencePlan(
  payload: WebsiteIntakePayload,
  dependencies: Pick<IntakePersistenceDependencies, 'now' | 'createId'> = {}
): IntakePersistencePlan {
  const now = dependencies.now?.() ?? defaultNow();
  const createId = dependencies.createId ?? defaultCreateId;
  const contactId = createId();
  const contactProfileId = createId();
  const conversationId = createId();
  const messageId = createId();
  const intakeId = createId();
  const taskId = createId();
  const auditId = createId();
  const status = chooseStatus(payload);
  const priority = choosePriority(payload);
  const flags = payload.request.flags ?? [];

  const sourceLabel = `${payload.source.site}:${payload.source.formName}`;

  return {
    mode: 'dry_run',
    warnings: ['Draft mapping only. No live database write occurs unless a server-side repository adapter is supplied and enabled.'],
    records: {
      contact: {
        id: contactId,
        primary_brand: payload.brand,
        name: payload.contact.name,
        email: normalizeEmail(payload.contact.email),
        phone: normalizeNullable(payload.contact.phone),
        town: normalizeNullable(payload.contact.town),
        customer_type: 'lead',
        source: sourceLabel,
        notes: payload.contact.preferredReplyChannel ? `Preferred reply channel: ${payload.contact.preferredReplyChannel}` : null,
        created_at: now,
        updated_at: now
      },
      contactBrandProfile: {
        id: contactProfileId,
        contact_id: contactId,
        brand: payload.brand,
        status: 'active',
        lead_quality: 'unknown',
        last_contacted_at: null,
        notes: null,
        created_at: now,
        updated_at: now
      },
      conversation: {
        id: conversationId,
        brand: payload.brand,
        contact_id: contactId,
        source_channel: 'website',
        status,
        priority,
        subject: payload.request.subject,
        summary: payload.request.message.slice(0, 280),
        assigned_to: null,
        last_activity_at: payload.source.submittedAt || now,
        created_at: now,
        updated_at: now
      },
      message: {
        id: messageId,
        conversation_id: conversationId,
        direction: 'inbound',
        channel: 'website',
        body: payload.request.message,
        attachments: payload.attachments ?? [],
        ai_generated: false,
        human_approved: false,
        approved_by: null,
        created_at: payload.source.submittedAt || now
      },
      intakeRequest: {
        id: intakeId,
        brand: payload.brand,
        contact_id: contactId,
        conversation_id: conversationId,
        intake_type: payload.intakeType,
        raw_answers: {
          source: payload.source,
          contact: payload.contact,
          request: payload.request,
          consent: payload.consent ?? null,
          attachments: payload.attachments ?? []
        },
        flags,
        recommended_service: payload.request.recommendedService ?? null,
        estimated_price_min: null,
        estimated_price_max: null,
        status: 'needs_review',
        created_at: now,
        updated_at: now
      },
      followUpTask: {
        id: taskId,
        brand: payload.brand,
        contact_id: contactId,
        conversation_id: conversationId,
        title: makeFollowUpTitle(payload),
        due_at: null,
        status: 'open',
        priority,
        notes: 'Created from protected website intake draft mapping. Admin must review before replying.',
        created_at: now,
        updated_at: now
      },
      auditEvent: {
        id: auditId,
        brand: payload.brand,
        actor_id: null,
        entity_type: 'intake_request',
        entity_id: intakeId,
        event_type: 'website_intake_mapped',
        details: 'Validated website intake payload mapped to draft persistence records.',
        metadata: {
          site: payload.source.site,
          formName: payload.source.formName,
          pageUrl: payload.source.pageUrl ?? null,
          dryRun: true
        },
        created_at: now
      }
    }
  };
}

export async function persistValidatedWebsiteIntake(
  payload: WebsiteIntakePayload,
  env: IntakePersistenceEnvironment,
  dependencies: IntakePersistenceDependencies = {}
): Promise<IntakePersistenceResult> {
  const plan = mapWebsiteIntakeToPersistencePlan(payload, dependencies);

  if (env.ENABLE_INTAKE_PERSISTENCE !== 'true') {
    return {
      mode: 'disabled',
      warnings: ['ENABLE_INTAKE_PERSISTENCE is not true. No records were stored.']
    };
  }

  if (!dependencies.repository) {
    return {
      mode: 'dry_run',
      intakeId: String(plan.records.intakeRequest.id),
      conversationId: String(plan.records.conversation.id),
      taskId: String(plan.records.followUpTask.id),
      warnings: plan.warnings
    };
  }

  const repository = dependencies.repository;
  const contact = await repository.createContact(plan.records.contact);
  await repository.createContactBrandProfile({ ...plan.records.contactBrandProfile, contact_id: contact.id });
  const conversation = await repository.createConversation({ ...plan.records.conversation, contact_id: contact.id });
  await repository.createMessage({ ...plan.records.message, conversation_id: conversation.id });
  const intake = await repository.createIntakeRequest({
    ...plan.records.intakeRequest,
    contact_id: contact.id,
    conversation_id: conversation.id
  });
  const task = await repository.createFollowUpTask({
    ...plan.records.followUpTask,
    contact_id: contact.id,
    conversation_id: conversation.id
  });
  await repository.createAuditEvent({ ...plan.records.auditEvent, entity_id: intake.id });

  return {
    mode: 'stored',
    intakeId: intake.id,
    conversationId: conversation.id,
    taskId: task.id,
    warnings: []
  };
}
