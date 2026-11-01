import type { OrganizationId } from './ql191Organizations';

export type IntakeField = Readonly<{ id: string; label: string; help: string; choices: readonly string[] }>;
export type IntakeFixture = Readonly<{ organizationId: OrganizationId; reference: string; scenario: string; reviewer: string; fields: readonly IntakeField[] }>;

export const ql296Fixtures: readonly IntakeFixture[] = [
  { organizationId: 'rosiedazzlers', reference: 'QL296-RD-01', scenario: 'Fictional SUV interior detail enquiry', reviewer: 'Detailing estimator', fields: [
    { id: 'vehicle', label: 'Vehicle size', help: 'Determines the sample service category; no VIN or licence plate.', choices: ['Small car', 'SUV / crossover', 'Oversize'] },
    { id: 'package', label: 'Requested service', help: 'A service interest, not a price or reserved slot.', choices: ['Interior', 'Exterior', 'Complete'] },
    { id: 'condition', label: 'Condition concern', help: 'Final assessment must happen separately.', choices: ['Light soil', 'Pet hair', 'Heavy stains'] },
    { id: 'access', label: 'Driveway utilities', help: 'Confirm water and power before any real appointment.', choices: ['Water and power to verify', 'Both reportedly available', 'Access unclear'] }
  ] },
  { organizationId: 'devilndove', reference: 'QL296-DD-01', scenario: 'Fictional personalized maker request', reviewer: 'Maker feasibility reviewer', fields: [
    { id: 'process', label: 'Making technique', help: 'Choose a sample production method.', choices: ['Laser engraving', 'Resin', 'Lost-wax casting'] },
    { id: 'material', label: 'Material family', help: 'Material stock remains unverified.', choices: ['Wood', 'Metal', 'Mixed materials'] },
    { id: 'design', label: 'Design readiness', help: 'Do not enter actual names, artwork or private wording.', choices: ['Artwork pending', 'Sizing pending', 'Concept review'] },
    { id: 'timing', label: 'Timing expectation', help: 'No delivery date is promised.', choices: ['Flexible', 'Date needs confirmation', 'Time-sensitive review'] }
  ] },
  { organizationId: 'yw', reference: 'QL296-YW-01', scenario: 'Fictional property maintenance request', reviewer: 'Property scope estimator', fields: [
    { id: 'service', label: 'Property service', help: 'A sample scope only; no dispatch.', choices: ['Lawn mowing', 'Seasonal cleanup', 'Snow removal'] },
    { id: 'site', label: 'Property type', help: 'No street address is collected.', choices: ['Residential', 'Commercial', 'Multi-unit'] },
    { id: 'access', label: 'Access assessment', help: 'A site visit would be required for an actual estimate.', choices: ['Gate/access review', 'Equipment access review', 'Unknown'] },
    { id: 'frequency', label: 'Requested frequency', help: 'Not a service contract.', choices: ['One-time', 'Recurring', 'To discuss'] }
  ] },
  { organizationId: 'icamp', reference: 'QL296-IC-01', scenario: 'Fictional campsite availability question', reviewer: 'Campground guest-service reviewer', fields: [
    { id: 'stay', label: 'Stay type', help: 'No site hold or reservation.', choices: ['Tent site', 'RV site', 'Cottage'] },
    { id: 'party', label: 'Party needs', help: 'Categories only; no guest identities.', choices: ['Small group', 'Family group', 'Accessibility review'] },
    { id: 'period', label: 'Travel window', help: 'No real dates are requested or reserved.', choices: ['Weekday inquiry', 'Weekend inquiry', 'Seasonal inquiry'] },
    { id: 'amenity', label: 'Priority amenity', help: 'Availability is not checked.', choices: ['Electricity', 'Accessible facilities', 'Waterfront interest'] }
  ] }
];

export function validateQl296(organizationId: OrganizationId, answers: Readonly<Record<string, string>>) {
  const fixture = ql296Fixtures.find((item) => item.organizationId === organizationId);
  if (!fixture || !answers || typeof answers !== 'object' || Array.isArray(answers)) return { valid: false, missing: [], issues: ['Unknown company or invalid answers'] };
  const ids = new Set(fixture.fields.map((field) => field.id));
  const issues = Object.keys(answers).filter((id) => !ids.has(id)).map((id) => `Unexpected field: ${id}`);
  const missing: string[] = [];
  for (const field of fixture.fields) {
    if (!answers[field.id]) missing.push(field.label);
    else if (!field.choices.includes(answers[field.id])) issues.push(`Invalid selection: ${field.label}`);
  }
  return { valid: missing.length === 0 && issues.length === 0, missing, issues };
}

export function ql296Handoff(organizationId: OrganizationId, answers: Readonly<Record<string, string>>) {
  const fixture = ql296Fixtures.find((item) => item.organizationId === organizationId);
  const result = validateQl296(organizationId, answers);
  if (!fixture || !result.valid) return null;
  return { reference: fixture.reference, reviewer: fixture.reviewer, status: 'UNSENT — INTERNAL SIMULATION ONLY' as const,
    lines: fixture.fields.map((field) => `${field.label}: ${answers[field.id]}`) };
}
