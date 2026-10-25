/** Browser presentation only. Real mock HMAC/session/replay exercises run in Node CI. */
import type { BrandId } from '../types';

export const QL188_VERSION = 'ql188-server-auth-webhook-replay-harness-v1' as const;
export const QL188_CASES = [
  { id: 'fresh', label: 'Fresh valid synthetic signed webhook', expected: 'ACCEPTED_MOCK',
    explanation: 'Ephemeral Node-only key, a fictional operator session, exact raw-body HMAC and a new event ID pass the isolated test.' },
  { id: 'missing_session', label: 'Missing or guessed operator session', expected: 'DENIED_SESSION',
    explanation: 'The simulated server requires an exact in-memory session; a sidebar selection is never an identity proof.' },
  { id: 'expired_session', label: 'Expired or future-issued session', expected: 'DENIED_SESSION',
    explanation: 'Synthetic session issue time must be current within the test-only lifetime.' },
  { id: 'readonly_role', label: 'Read-only operator attempts review', expected: 'DENIED_ROLE',
    explanation: 'The fictional read-only role cannot exercise even this preview handler.' },
  { id: 'cross_brand', label: 'Other-brand session or signed event', expected: 'DENIED_SCOPE',
    explanation: 'Trusted mock session brand and signed event brand must both match the requested brand.' },
  { id: 'bad_signature', label: 'Incorrect signature or wrong signing key', expected: 'DENIED_SIGNATURE',
    explanation: 'Node compares HMAC digests with timingSafeEqual; vendor signature formats are not implemented.' },
  { id: 'modified_body', label: 'Body, event ID or timestamp changed after signing', expected: 'DENIED_SIGNATURE',
    explanation: 'The hypothetical signature binds exact unmodified UTF-8 raw content, brand, event ID and time.' },
  { id: 'stale', label: 'Timestamp outside five-minute test window', expected: 'DENIED_TIME',
    explanation: 'Old and far-future messages fail; provider-specific timestamp verification remains unimplemented.' },
  { id: 'duplicate', label: 'Exact webhook retried', expected: 'DENIED_REPLAY',
    explanation: 'A previously accepted test event ID is rejected by a memory-only deduplication set.' },
  { id: 'collision', label: 'Same event ID with different signed content', expected: 'DENIED_REPLAY',
    explanation: 'A fresh valid signature never permits an already-consumed event ID to be applied twice.' },
  { id: 'oversize', label: 'Malformed, injected or oversized payload', expected: 'DENIED_PAYLOAD',
    explanation: 'An exact field allowlist, payload format, HMAC encoding and UTF-8 size cap fail closed.' }
] as const;

export type Ql188CaseId = typeof QL188_CASES[number]['id'];

export const QL188_LIVE_GATES = [
  'Choose an actual provider and implement its official signature verifier; the generic mock HMAC format is NOT compatible.',
  'Use authenticated HTTPS server endpoints and verify server-side session and current role/brand against trusted authority.',
  'Never rely on editable user_metadata claims, client-selected brand or browser presence to establish authorization.',
  'Use separately protected provider secrets, rotate credentials and test failure/incident revocation.',
  'Persist idempotency atomically, bind provider event identity and payload, and test concurrent/reordered retries.',
  'Enforce per-tenant privacy/RLS, data minimization, retention, consent and independent QL-181 pilot sign-off.',
  'Add request size/rate limits, safe response codes, logs, alerting, rollback and webhook failure drills.'
] as const;

export type Ql188PreviewResult = Readonly<{
  version: typeof QL188_VERSION;
  disposition: 'ILLUSTRATIVE_CASE_ONLY' | 'CROSS_BRAND_REJECTED' | 'INVALID_PREVIEW_REQUEST';
  brandId: BrandId | null;
  expectedServerDisposition: string | null;
  explanation: string;
  realSessionAuthenticated: false;
  realProviderSignatureVerified: false;
  liveWebhookEndpoint: false;
  providerSecretsConfigured: false;
  durableReplayLedger: false;
  providerEventReceived: false;
  dispatchAllowed: false;
  livePilotAuthorized: false;
  heldPrerequisites: 12;
  externalWrites: 0;
  messagesSent: 0;
  callsPlaced: 0;
}>;

export function viewQl188Case(activeBrand: unknown, targetBrand: unknown, caseId: unknown): Ql188PreviewResult {
  const safety = { version: QL188_VERSION, realSessionAuthenticated: false,
    realProviderSignatureVerified: false, liveWebhookEndpoint: false, providerSecretsConfigured: false,
    durableReplayLedger: false, providerEventReceived: false, dispatchAllowed: false,
    livePilotAuthorized: false, heldPrerequisites: 12, externalWrites: 0,
    messagesSent: 0, callsPlaced: 0 } as const;
  if (!['rosiedazzlers', 'devilndove'].includes(activeBrand as string) ||
      !['rosiedazzlers', 'devilndove'].includes(targetBrand as string) ||
      !QL188_CASES.some(row => row.id === caseId))
    return { ...safety, disposition: 'INVALID_PREVIEW_REQUEST', brandId: null,
      expectedServerDisposition: null, explanation: 'Unknown synthetic case or business context.' };
  if (activeBrand !== targetBrand)
    return { ...safety, disposition: 'CROSS_BRAND_REJECTED', brandId: null,
      expectedServerDisposition: null, explanation: 'Business mismatch: no other-brand mock evidence is displayed.' };
  const item = QL188_CASES.find(row => row.id === caseId)!;
  return { ...safety, disposition: 'ILLUSTRATIVE_CASE_ONLY', brandId: activeBrand as BrandId,
    expectedServerDisposition: item.expected, explanation: item.explanation };
}
