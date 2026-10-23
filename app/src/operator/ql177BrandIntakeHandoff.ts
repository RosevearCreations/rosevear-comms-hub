/**
 * QL-177 — source-pinned, brand-isolated synthetic intake/quote-review handoff.
 * Projection and edits are ephemeral. No quote is issued and no task is created.
 */
import type { BrandId } from '../types';
import { validateQl173CanonicalSnapshot, type Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';
import { redactQl176Draft } from './ql176ConversationTimeline';

export const QL177_TEMPLATE_VERSION = 'ql177-intake-preview-v1' as const;
export type Ql177Field = Readonly<{
  id: string;
  label: string;
  help: string;
  required: boolean;
  options: readonly Readonly<{ value: string; label: string }>[];
}>;

const UNKNOWN = 'not_provided';
const rosieFields: readonly Ql177Field[] = [
  { id: 'vehicle_type', label: 'Vehicle size / type', help: 'Use a synthetic vehicle category; do not enter licence plates or VINs.', required: true, options: [
    { value: 'small', label: 'Small vehicle' }, { value: 'medium', label: 'Medium car' }, { value: 'suv', label: 'SUV / crossover' }, { value: 'oversize', label: 'Oversize vehicle' }] },
  { id: 'service', label: 'Requested detailing service', help: 'A preview category, not a booked package or price.', required: true, options: [
    { value: 'interior', label: 'Interior detailing' }, { value: 'exterior', label: 'Exterior detailing' }, { value: 'complete', label: 'Complete detail' }, { value: 'ceramic_review', label: 'Ceramic coating assessment' }] },
  { id: 'condition', label: 'Vehicle condition / concern', help: 'An internal condition cue; a real quote requires independent inspection.', required: true, options: [
    { value: 'light', label: 'Light soil' }, { value: 'moderate', label: 'Moderate soil' }, { value: 'heavy', label: 'Heavy soil / staining' }, { value: 'pet_hair', label: 'Pet-hair concern' }] },
  { id: 'photos', label: 'Photo review need', help: 'No upload or image link is accepted in this preview.', required: true, options: [
    { value: 'interior_needed', label: 'Interior images needed' }, { value: 'exterior_needed', label: 'Exterior / paint images needed' }, { value: 'both_needed', label: 'Interior and exterior images needed' }, { value: 'operator_assess', label: 'Operator to assess photo needs' }] },
  { id: 'coverage', label: 'Service area pre-check', help: 'Synthetic availability screening only, not a booking or travel commitment.', required: false, options: [
    { value: 'oxford', label: 'Oxford County sample' }, { value: 'norfolk', label: 'Norfolk County sample' }, { value: 'review_needed', label: 'Coverage review needed' }] }
];

const makerFields: readonly Ql177Field[] = [
  { id: 'technique', label: 'Maker technique', help: 'Select a production process to guide internal review only.', required: true, options: [
    { value: 'candles', label: 'Candles / engraving' }, { value: 'resin', label: 'UV / epoxy resin' }, { value: 'polymer_clay', label: 'Polymer clay' }, { value: 'wire_wrap', label: 'Wire wrapping' }, { value: 'laser', label: 'Laser / custom engraving' }] },
  { id: 'materials', label: 'Material family', help: 'Feasibility and material availability are not guaranteed.', required: true, options: [
    { value: 'wax', label: 'Wax / candle supplies' }, { value: 'resin', label: 'Resin / pigments' }, { value: 'clay', label: 'Polymer clay' }, { value: 'metal', label: 'Wire / metal' }, { value: 'mixed', label: 'Mixed materials — review' }] },
  { id: 'reference', label: 'Design / reference needs', help: 'Reference files are never uploaded or transmitted here.', required: true, options: [
    { value: 'references_needed', label: 'Design or reference images needed' }, { value: 'wording_needed', label: 'Personalization wording needed' }, { value: 'operator_review', label: 'Custom design review needed' }] },
  { id: 'timing', label: 'Timing expectation', help: 'Timing is an intake hint, not an accepted deadline or production promise.', required: true, options: [
    { value: 'flexible', label: 'Flexible timing' }, { value: 'date_to_confirm', label: 'Date to confirm' }, { value: 'time_sensitive_review', label: 'Time-sensitive feasibility review' }] },
  { id: 'specifications', label: 'Measurements / specification needs', help: 'Do not enter private names, actual engraving wording, addresses or order details.', required: false, options: [
    { value: 'specs_pending', label: 'Dimensions / specs pending' }, { value: 'style_to_review', label: 'Style preference to review' }, { value: 'scope_unknown', label: 'Scope to clarify' }] }
];

export function getQl177Template(brandId: BrandId): readonly Ql177Field[] {
  return brandId === 'rosiedazzlers' ? rosieFields : brandId === 'devilndove' ? makerFields : [];
}

export type Ql177ReviewStatus = 'INCOMPLETE_SIMULATED' | 'READY_FOR_INTERNAL_REVIEW_SIMULATED';
export type Ql177OverlayEntry = Readonly<{
  brandId: BrandId;
  fields: Readonly<Record<string, string>>;
  note: string;
  reviewStatus: Ql177ReviewStatus;
  source: 'LOCAL_SCREEN_ONLY';
}>;
export type Ql177Overlay = Readonly<Record<string, Ql177OverlayEntry>>;

export type Ql177Intake = Readonly<{
  id: string;
  conversationId: string;
  contactId: string;
  brandId: BrandId;
  subject: string;
  contactLabel: string;
  fixtureLabel: string;
  templateVersion: typeof QL177_TEMPLATE_VERSION;
  linkedIntakeId: string | null;
  linkedTaskId: string | null;
  linkedTaskTitle: string | null;
  intakeStatus: 'CANONICAL_NEEDS_REVIEW' | 'DERIVED_PREVIEW_ONLY';
  fields: Readonly<Record<string, string>>;
  note: string;
  missingFields: readonly string[];
  reviewStatus: Ql177ReviewStatus;
  handoffId: string;
  syntheticOnly: true;
}>;

function validSource(migration: Ql173Migration, brandId: BrandId): boolean {
  return ['rosiedazzlers', 'devilndove'].includes(brandId) && migration.verified &&
    validateQl173CanonicalSnapshot(migration.snapshot).length === 0;
}

export function validateQl177Fields(brandId: BrandId, values: Readonly<Record<string, string>>): { valid: boolean; missingFields: string[]; issues: string[] } {
  const template = getQl177Template(brandId);
  if (!template.length || !values || typeof values !== 'object' || Array.isArray(values)) return { valid: false, missingFields: [], issues: ['invalid brand or intake fields'] };
  const allowed = new Set(template.map(field => field.id));
  const issues = Object.keys(values).filter(key => !allowed.has(key)).map(key => `unknown intake field: ${key}`);
  const missingFields: string[] = [];
  for (const field of template) {
    const value = values[field.id] ?? UNKNOWN;
    if (typeof value !== 'string' || (value !== UNKNOWN && !field.options.some(option => option.value === value))) issues.push(`invalid ${field.id} selection`);
    if (field.required && value === UNKNOWN) missingFields.push(field.label);
  }
  return { valid: issues.length === 0 && missingFields.length === 0, missingFields, issues };
}

function fixtureDefaults(brandId: BrandId, rawAnswers: Readonly<Record<string, string | string[] | boolean | number | null>> | undefined, flags: readonly string[] = [], recommendedService = ''): Record<string, string> {
  const fields = Object.fromEntries(getQl177Template(brandId).map(field => [field.id, UNKNOWN]));
  if (brandId === 'rosiedazzlers' && rawAnswers) {
    if (String(rawAnswers.vehicle_type).toLowerCase() === 'suv') fields.vehicle_type = 'suv';
    if (recommendedService.toLowerCase().includes('interior')) fields.service = 'interior';
    if (flags.includes('pet_hair') || String(rawAnswers.concern).toLowerCase().includes('pet hair')) fields.condition = 'pet_hair';
    if (flags.includes('needs_photos')) fields.photos = 'interior_needed';
  }
  return fields;
}

export function getQl177BrandIntakes(migration: Ql173Migration, brandId: BrandId, overlay: Ql177Overlay = {}): Ql177Intake[] {
  if (!validSource(migration, brandId)) return [];
  const snapshot = migration.snapshot;
  const contacts = new Map(snapshot.contacts.filter(row => row.primaryBrand === brandId).map(row => [row.id, row]));
  return snapshot.conversations.flatMap(conversation => {
    if (conversation.brandId !== brandId) return [];
    const contact = contacts.get(conversation.contactId);
    if (!contact) return [];
    const linkedIntake = snapshot.intakeRequests.find(row => row.brandId === brandId && row.conversationId === conversation.id && row.contactId === contact.id);
    const linkedTask = snapshot.followUpTasks.find(row => row.brandId === brandId && row.conversationId === conversation.id && row.contactId === contact.id && row.status === 'open');
    const defaults = fixtureDefaults(brandId, linkedIntake?.rawAnswers, linkedIntake?.flags, linkedIntake?.recommendedService);
    const staged = overlay[conversation.id];
    const validOverlay = staged?.brandId === brandId && staged.source === 'LOCAL_SCREEN_ONLY' &&
      ['INCOMPLETE_SIMULATED', 'READY_FOR_INTERNAL_REVIEW_SIMULATED'].includes(staged.reviewStatus) &&
      typeof staged.note === 'string' && validateQl177Fields(brandId, staged.fields).issues.length === 0 &&
      (staged.reviewStatus !== 'READY_FOR_INTERNAL_REVIEW_SIMULATED' || validateQl177Fields(brandId, staged.fields).valid);
    const fields = validOverlay ? { ...staged.fields } : defaults;
    const missingFields = validateQl177Fields(brandId, fields).missingFields;
    return [{
      id: `ql177-intake:${conversation.id}`, conversationId: conversation.id, contactId: contact.id,
      brandId, subject: conversation.subject, contactLabel: contact.name,
      fixtureLabel: `${conversation.provenance.sourceSetVersion} · ${conversation.provenance.sourceId}`,
      templateVersion: QL177_TEMPLATE_VERSION,
      linkedIntakeId: linkedIntake?.id ?? null, linkedTaskId: linkedTask?.id ?? null,
      linkedTaskTitle: linkedTask?.title ?? null,
      intakeStatus: linkedIntake ? 'CANONICAL_NEEDS_REVIEW' as const : 'DERIVED_PREVIEW_ONLY' as const,
      fields, note: validOverlay ? redactQl176Draft(staged.note) : '', missingFields,
      reviewStatus: validOverlay ? staged.reviewStatus : 'INCOMPLETE_SIMULATED',
      handoffId: `ql177-internal-review:${conversation.id}`, syntheticOnly: true as const
    }];
  }).sort((a, b) => a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id));
}

export function updateQl177Intake(
  migration: Ql173Migration, brandId: BrandId, previous: Ql177Overlay, conversationId: string,
  action: 'edit' | 'stage' | 'reset', fieldId?: string, value?: string
): Ql177Overlay {
  const base = getQl177BrandIntakes(migration, brandId).find(row => row.conversationId === conversationId);
  if (!base || !['edit', 'stage', 'reset'].includes(action)) return previous;
  if (action === 'reset') { const next = { ...previous }; delete next[conversationId]; return next; }
  const current = getQl177BrandIntakes(migration, brandId, previous).find(row => row.conversationId === conversationId);
  if (!current) return previous;
  let fields = { ...current.fields };
  let note = current.note;
  if (action === 'edit') {
    if (typeof value !== 'string') return previous;
    if (fieldId === 'internal_note') note = redactQl176Draft(value);
    else {
      const field = getQl177Template(brandId).find(row => row.id === fieldId);
      if (!field || (value !== UNKNOWN && !field.options.some(option => option.value === value))) return previous;
      fields = { ...fields, [field.id]: value };
    }
  }
  if (action === 'stage' && !validateQl177Fields(brandId, fields).valid) return previous;
  return { ...previous, [conversationId]: {
    brandId, fields, note, source: 'LOCAL_SCREEN_ONLY',
    reviewStatus: action === 'stage' ? 'READY_FOR_INTERNAL_REVIEW_SIMULATED' : 'INCOMPLETE_SIMULATED'
  } };
}
