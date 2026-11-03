import type { OrganizationId } from './ql191Organizations';
import type { IntakeFixture } from './ql296GuidedIntake';
import type { Ql295ContactPosture } from './ql295ContactReview';

export const ql316Brands: Readonly<Record<OrganizationId, { label: string; workstream: string; reviewPrompt: string }>> = {
  rosiedazzlers: { label: 'Rosie Dazzlers', workstream: 'Vehicle detailing', reviewPrompt: 'Confirm vehicle size, driveway access and exact starting-price quote separately.' },
  devilndove: { label: 'Devil n Dove', workstream: 'Maker commissions', reviewPrompt: 'Confirm design rights, material stock, fabrication method and timing separately.' },
  yw: { label: 'Yard Workers', workstream: 'Property maintenance', reviewPrompt: 'Confirm property scope, equipment access, season and estimate separately.' },
  icamp: { label: 'iCamp', workstream: 'Campground guest services', reviewPrompt: 'Verify availability, site suitability and campground rules separately.' }
};

/** A red/amber status can never be mistaken for a permission to contact someone. */
export function ql316ConsentReadback(posture: Ql295ContactPosture) {
  return posture.effective === 'opted_out'
    ? { tone: 'opted-out' as const, label: 'OPTED OUT · Marketing prohibited', sourceNote: 'One restrictive source applies across this fictional contact.' }
    : posture.effective === 'service_only'
      ? { tone: 'service-only' as const, label: 'SERVICE ONLY · No marketing permission', sourceNote: 'Service context is not an authorization to send.' }
      : { tone: 'unknown' as const, label: 'UNVERIFIED · No outbound permission', sourceNote: 'Unknown or missing source consent fails closed.' };
}

/** Only actual choices from this exact business's checked-in fixture count as completed. */
export function ql316IntakeProgress(fixture: IntakeFixture, answers: Readonly<Record<string, string>>) {
  const completed = fixture.fields.filter((field) => field.choices.includes(answers[field.id] ?? '')).length;
  return { completed, total: fixture.fields.length, remaining: fixture.fields.length - completed, label: `${completed} of ${fixture.fields.length} fictional questions selected` };
}
