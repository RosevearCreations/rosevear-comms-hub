import {
  getSupabaseReadOnlyClientState,
  loadSyntheticConversationRows,
  loadSyntheticSystemStatusRows,
  type SupabaseReadOnlyClientStatus,
  type SyntheticConversationReadRow,
  type SyntheticSystemStatusReadRow
} from '../integrations/supabaseReadOnlyClient';
import type { BrandId } from '../types';

export type Ql093ReadSource = 'local_fallback' | 'validated_supabase' | 'partial_supabase_with_fallback';
export type Ql093PreviewRowSource = 'local_fallback' | 'validated_supabase';

type CleanStringResult = { ok: true; value: string } | { ok: false; reason: string };

export type Ql093SyntheticConversationPreview = {
  id: string;
  brandId: BrandId;
  brandName: string;
  title: string;
  status: string;
  summary: string;
  draft: string;
  createdAt: string;
  source: Ql093PreviewRowSource;
};

export type Ql093SyntheticSystemStatusPreview = {
  id: string;
  label: string;
  status: 'ready' | 'blocked' | 'planned';
  detail: string;
  createdAt: string;
  source: Ql093PreviewRowSource;
};

export type Ql093SafeReadResult = {
  build: 'QL-093';
  title: string;
  selectedBrandId: BrandId;
  source: Ql093ReadSource;
  activeSourceLabel: string;
  readOnlyClientStatus: SupabaseReadOnlyClientStatus;
  conversationRows: readonly Ql093SyntheticConversationPreview[];
  systemStatusRows: readonly Ql093SyntheticSystemStatusPreview[];
  rejectedRows: readonly string[];
  fallbackReason?: string;
  safetyLockouts: readonly string[];
  generatedAt: string;
};

const approvedBrandAliases: Record<string, BrandId> = {
  rosie: 'rosiedazzlers',
  rosiedazzlers: 'rosiedazzlers',
  'rosie-dazzlers': 'rosiedazzlers',
  devil: 'devilndove',
  devilndove: 'devilndove',
  'devil-n-dove': 'devilndove',
  devil_n_dove: 'devilndove'
};

const approvedConversationKeys = ['id', 'brand_id', 'brand_name', 'title', 'status', 'summary', 'draft', 'created_at'] as const;
const approvedSystemStatusKeys = ['id', 'label', 'status', 'detail', 'created_at'] as const;
const allowedSystemStatuses = ['ready', 'blocked', 'planned'] as const;

const blockedPayloadFields = [
  'contact_id',
  'customer_id',
  'phone',
  'email',
  'message_body',
  'provider_payload',
  'sms_sid',
  'call_sid',
  'recording_url',
  'archive_id',
  'retention_record_id',
  'admin_user_id',
  'consent_log_id',
  'audit_event_id'
];

const unsafeStatusTokens = ['sms', 'call', 'phone', 'provider', 'callback', 'archive', 'retention', 'live', 'sent', 'delivered', 'auto_send'];

export const ql093SafetyLockouts = [
  'No browser writes, inserts, updates, deletes, RPC mutations, storage uploads, or session persistence.',
  'No live customer/contact/conversation/message/provider payload rows can hydrate the public preview.',
  'No Phone/SMS provider callbacks, live calls, SMS sending, recording, archive, retention, consent, audit, or admin runtime is enabled.',
  'No AI generation, AI sending, provider delivery, or live pilot runtime is available from this build.'
] as const;

const localFallbackConversations: readonly Ql093SyntheticConversationPreview[] = [
  {
    id: 'rosie-ceramic-quote',
    brandId: 'rosiedazzlers',
    brandName: 'Rosie Dazzlers',
    title: 'Ceramic quote follow-up',
    status: 'local_fallback',
    summary: 'Local synthetic ceramic coating follow-up with paint-prep and weather-safe scheduling context.',
    draft: 'Draft-only sample: confirm vehicle size, explain prep expectations, and offer a weather-safe booking window.',
    createdAt: '2026-10-10T15:45:00-04:00',
    source: 'local_fallback'
  },
  {
    id: 'rosie-missed-call',
    brandId: 'rosiedazzlers',
    brandName: 'Rosie Dazzlers',
    title: 'Missed-call callback sample',
    status: 'local_fallback',
    summary: 'Local synthetic missed-call card for a detailing appointment after work hours.',
    draft: 'Draft-only sample: acknowledge the missed call, ask for vehicle size, and suggest AM/PM availability.',
    createdAt: '2026-10-10T15:45:00-04:00',
    source: 'local_fallback'
  },
  {
    id: 'devil-custom-order',
    brandId: 'devilndove',
    brandName: 'Devil n Dove',
    title: 'Custom order clarification sample',
    status: 'local_fallback',
    summary: 'Local synthetic custom-order question about colour, sizing, and personalization.',
    draft: 'Draft-only sample: confirm colour, size, personalization limits, and expected making time.',
    createdAt: '2026-10-10T15:45:00-04:00',
    source: 'local_fallback'
  },
  {
    id: 'devil-maker-story',
    brandId: 'devilndove',
    brandName: 'Devil n Dove',
    title: 'Maker story question sample',
    status: 'local_fallback',
    summary: 'Local synthetic shopper asks about the Devil n Dove meaning and materials.',
    draft: 'Draft-only sample: explain the Devil barriers / Dove hope theme and invite a specific product question.',
    createdAt: '2026-10-10T15:45:00-04:00',
    source: 'local_fallback'
  }
];

const localFallbackSystemStatus: readonly Ql093SyntheticSystemStatusPreview[] = [
  {
    id: 'ql093-local-fallback-active',
    label: 'Local fallback active',
    status: 'ready',
    detail: 'Public disabled preview can render local synthetic samples without Supabase browser reads.',
    createdAt: '2026-10-11T00:00:00-04:00',
    source: 'local_fallback'
  },
  {
    id: 'ql093-live-runtime-locked',
    label: 'Live communications runtime',
    status: 'blocked',
    detail: 'Phone/SMS providers, callbacks, recordings, archives, retention writes, and live pilot runtime remain disabled.',
    createdAt: '2026-10-11T00:00:00-04:00',
    source: 'local_fallback'
  }
];

function mapBrandId(rawBrandId: string): BrandId | null {
  return approvedBrandAliases[rawBrandId.trim().toLowerCase()] ?? null;
}

function hasOnlyAllowedKeys(row: Record<string, unknown>, allowedKeys: readonly string[]): string | null {
  const unexpectedKey = Object.keys(row).find((key) => !allowedKeys.includes(key));

  if (unexpectedKey) {
    return `unexpected field "${unexpectedKey}"`;
  }

  const blockedField = Object.keys(row).find((key) => blockedPayloadFields.includes(key));

  if (blockedField) {
    return `blocked live/private field "${blockedField}"`;
  }

  return null;
}

function cleanString(value: unknown, field: string, maxLength: number): CleanStringResult {
  if (typeof value !== 'string') {
    return { ok: false, reason: `${field} is not a string` };
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, reason: `${field} is empty` };
  }

  if (trimmed.length > maxLength) {
    return { ok: false, reason: `${field} exceeds ${maxLength} characters` };
  }

  return { ok: true, value: trimmed };
}

function cleanSyntheticId(value: unknown, field: string): CleanStringResult {
  const cleaned = cleanString(value, field, 80);

  if (!cleaned.ok) {
    return cleaned;
  }

  if (!/^[a-z0-9][a-z0-9_-]{1,79}$/i.test(cleaned.value)) {
    return { ok: false, reason: `${field} is not an approved synthetic id` };
  }

  return cleaned;
}

function cleanDateString(value: unknown, field: string): CleanStringResult {
  const cleaned = cleanString(value, field, 80);

  if (!cleaned.ok) {
    return cleaned;
  }

  if (Number.isNaN(Date.parse(cleaned.value))) {
    return { ok: false, reason: `${field} is not a parseable date` };
  }

  return cleaned;
}

function requireClean(result: CleanStringResult): string | null {
  return result.ok ? null : result.reason;
}

function validateConversationRow(
  row: SyntheticConversationReadRow,
  selectedBrandId: BrandId
): { ok: true; value: Ql093SyntheticConversationPreview } | { ok: false; reason: string } {
  const raw = row as unknown as Record<string, unknown>;
  const keyFailure = hasOnlyAllowedKeys(raw, approvedConversationKeys);

  if (keyFailure) {
    return { ok: false, reason: keyFailure };
  }

  const id = cleanSyntheticId(raw.id, 'conversation id');
  const brandRaw = cleanString(raw.brand_id, 'brand id', 40);
  const brandName = cleanString(raw.brand_name, 'brand name', 80);
  const title = cleanString(raw.title, 'title', 120);
  const status = cleanString(raw.status, 'status', 80);
  const summary = cleanString(raw.summary, 'summary', 520);
  const draft = cleanString(raw.draft, 'draft', 720);
  const createdAt = cleanDateString(raw.created_at, 'created_at');
  const firstFailure = [id, brandRaw, brandName, title, status, summary, draft, createdAt].map(requireClean).find(Boolean);

  if (firstFailure) {
    return { ok: false, reason: firstFailure };
  }

  if (!id.ok || !brandRaw.ok || !brandName.ok || !title.ok || !status.ok || !summary.ok || !draft.ok || !createdAt.ok) {
    return { ok: false, reason: 'conversation row failed validation' };
  }

  const brandId = mapBrandId(brandRaw.value);

  if (!brandId) {
    return { ok: false, reason: `brand id "${brandRaw.value}" is not approved for the disabled preview` };
  }

  if (brandId !== selectedBrandId) {
    return { ok: false, reason: `brand id "${brandRaw.value}" does not match selected preview brand` };
  }

  const unsafeStatus = unsafeStatusTokens.find((token) => status.value.toLowerCase().includes(token));

  if (unsafeStatus) {
    return { ok: false, reason: `status includes unsafe runtime token "${unsafeStatus}"` };
  }

  return {
    ok: true,
    value: {
      id: id.value,
      brandId,
      brandName: brandName.value,
      title: title.value,
      status: status.value,
      summary: summary.value,
      draft: draft.value,
      createdAt: createdAt.value,
      source: 'validated_supabase'
    }
  };
}

function validateSystemStatusRow(
  row: SyntheticSystemStatusReadRow
): { ok: true; value: Ql093SyntheticSystemStatusPreview } | { ok: false; reason: string } {
  const raw = row as unknown as Record<string, unknown>;
  const keyFailure = hasOnlyAllowedKeys(raw, approvedSystemStatusKeys);

  if (keyFailure) {
    return { ok: false, reason: keyFailure };
  }

  const id = cleanSyntheticId(raw.id, 'system status id');
  const label = cleanString(raw.label, 'label', 100);
  const status = cleanString(raw.status, 'status', 20);
  const detail = cleanString(raw.detail, 'detail', 420);
  const createdAt = cleanDateString(raw.created_at, 'created_at');
  const firstFailure = [id, label, status, detail, createdAt].map(requireClean).find(Boolean);

  if (firstFailure) {
    return { ok: false, reason: firstFailure };
  }

  if (!id.ok || !label.ok || !status.ok || !detail.ok || !createdAt.ok) {
    return { ok: false, reason: 'system status row failed validation' };
  }

  if (!allowedSystemStatuses.includes(status.value as (typeof allowedSystemStatuses)[number])) {
    return { ok: false, reason: `system status "${status.value}" is not ready, blocked, or planned` };
  }

  return {
    ok: true,
    value: {
      id: id.value,
      label: label.value,
      status: status.value as 'ready' | 'blocked' | 'planned',
      detail: detail.value,
      createdAt: createdAt.value,
      source: 'validated_supabase'
    }
  };
}

function fallbackRowsForBrand(selectedBrandId: BrandId): readonly Ql093SyntheticConversationPreview[] {
  return localFallbackConversations.filter((row) => row.brandId === selectedBrandId);
}

function buildResult(params: {
  selectedBrandId: BrandId;
  source: Ql093ReadSource;
  conversationRows: readonly Ql093SyntheticConversationPreview[];
  systemStatusRows: readonly Ql093SyntheticSystemStatusPreview[];
  rejectedRows: readonly string[];
  fallbackReason?: string;
}): Ql093SafeReadResult {
  const state = getSupabaseReadOnlyClientState();
  const sourceLabel =
    params.source === 'validated_supabase'
      ? 'Validated Supabase synthetic reads'
      : params.source === 'partial_supabase_with_fallback'
        ? 'Validated synthetic reads with local fallback'
        : 'Local synthetic fallback';

  return {
    build: 'QL-093',
    title: 'Public Disabled Preview Validated Synthetic Safe Reads Implementation',
    selectedBrandId: params.selectedBrandId,
    source: params.source,
    activeSourceLabel: sourceLabel,
    readOnlyClientStatus: state.status,
    conversationRows: params.conversationRows,
    systemStatusRows: params.systemStatusRows,
    rejectedRows: params.rejectedRows,
    fallbackReason: params.fallbackReason,
    safetyLockouts: ql093SafetyLockouts,
    generatedAt: new Date().toISOString()
  };
}

export function getLocalFallbackSafeReadResult(selectedBrandId: BrandId, fallbackReason: string): Ql093SafeReadResult {
  return buildResult({
    selectedBrandId,
    source: 'local_fallback',
    conversationRows: fallbackRowsForBrand(selectedBrandId),
    systemStatusRows: localFallbackSystemStatus,
    rejectedRows: [],
    fallbackReason
  });
}

export async function loadValidatedSyntheticSafeReads(selectedBrandId: BrandId): Promise<Ql093SafeReadResult> {
  const state = getSupabaseReadOnlyClientState();

  if (!state.canCreateClient) {
    return getLocalFallbackSafeReadResult(selectedBrandId, state.message);
  }

  const rejectedRows: string[] = [];
  const fallbackReasons: string[] = [];

  const conversationRead = await loadSyntheticConversationRows().catch((error: unknown) => ({
    source: 'fallback' as const,
    rows: [] as SyntheticConversationReadRow[],
    error: error instanceof Error ? error.message : 'Synthetic conversation read failed.'
  }));

  const systemStatusRead = await loadSyntheticSystemStatusRows().catch((error: unknown) => ({
    source: 'fallback' as const,
    rows: [] as SyntheticSystemStatusReadRow[],
    error: error instanceof Error ? error.message : 'Synthetic system status read failed.'
  }));

  let conversationRows: readonly Ql093SyntheticConversationPreview[] = fallbackRowsForBrand(selectedBrandId);
  let systemStatusRows: readonly Ql093SyntheticSystemStatusPreview[] = localFallbackSystemStatus;
  let conversationSource: Ql093PreviewRowSource = 'local_fallback';
  let systemSource: Ql093PreviewRowSource = 'local_fallback';

  if (conversationRead.source === 'supabase') {
    const validated = conversationRead.rows.flatMap((row) => {
      const result = validateConversationRow(row, selectedBrandId);

      if (!result.ok) {
        rejectedRows.push(`conversation:${typeof row?.id === 'string' ? row.id : 'unknown'}:${result.reason}`);
        return [];
      }

      return [result.value];
    });

    if (validated.length > 0) {
      conversationRows = validated;
      conversationSource = 'validated_supabase';
    } else {
      fallbackReasons.push('No Supabase synthetic conversation rows passed QL-093 validation for the selected brand.');
    }
  } else {
    fallbackReasons.push(conversationRead.error ?? 'Supabase synthetic conversation read returned fallback.');
  }

  if (systemStatusRead.source === 'supabase') {
    const validated = systemStatusRead.rows.flatMap((row) => {
      const result = validateSystemStatusRow(row);

      if (!result.ok) {
        rejectedRows.push(`system:${typeof row?.id === 'string' ? row.id : 'unknown'}:${result.reason}`);
        return [];
      }

      return [result.value];
    });

    if (validated.length > 0) {
      systemStatusRows = validated;
      systemSource = 'validated_supabase';
    } else {
      fallbackReasons.push('No Supabase system status rows passed QL-093 validation.');
    }
  } else {
    fallbackReasons.push(systemStatusRead.error ?? 'Supabase system status read returned fallback.');
  }

  const source: Ql093ReadSource =
    conversationSource === 'validated_supabase' && systemSource === 'validated_supabase'
      ? 'validated_supabase'
      : conversationSource === 'validated_supabase' || systemSource === 'validated_supabase'
        ? 'partial_supabase_with_fallback'
        : 'local_fallback';

  return buildResult({
    selectedBrandId,
    source,
    conversationRows,
    systemStatusRows,
    rejectedRows: rejectedRows.slice(0, 12),
    fallbackReason: fallbackReasons.length > 0 ? fallbackReasons.join(' ') : undefined
  });
}

export function getQl093SafeReadImplementationSummary(): string {
  return 'QL-093 validates browser-safe Supabase synthetic public-view rows before display-only hydration and falls back to local synthetic samples without writes or live communications.';
}
