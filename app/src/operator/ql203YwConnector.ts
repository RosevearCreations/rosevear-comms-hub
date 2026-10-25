import { inboxForOrganization } from './ql192InboxFixtures';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import type { OrganizationId } from './ql191Organizations';

export type YwServiceModule = 'snow_removal' | 'septic_services' | 'rural_garbage' | 'lawn_grounds' | 'arboriculture';
export const ywDemoCompanies: readonly { id: string; name: string; enabledModules: readonly YwServiceModule[] }[] = [
  { id: 'yard-rosevear-demo', name: 'Yard Rosevear · fictional PMS tenant', enabledModules: ['snow_removal', 'septic_services', 'rural_garbage', 'lawn_grounds'] },
  { id: 'yard-isolated-demo', name: 'Other demo company · isolated tenant', enabledModules: ['snow_removal'] }
];
export const ywDemoProperties: readonly { id: string; companyId: string; label: string }[] = [
  { id: 'yw-farm-road-demo', companyId: 'yard-rosevear-demo', label: 'Fictional rural property · Lot A' },
  { id: 'yw-village-demo', companyId: 'yard-rosevear-demo', label: 'Fictional village property · Lot B' },
  { id: 'yw-isolated-lot', companyId: 'yard-isolated-demo', label: 'Other company test property · isolated' }
];
export const ywModuleLabels: Readonly<Record<YwServiceModule, string>> = {
  snow_removal: 'Snow removal', septic_services: 'Septic services', rural_garbage: 'Rural garbage',
  lawn_grounds: 'Lawn & grounds', arboriculture: 'Arboriculture & tree care'
};
export interface YwInquiryFixture {
  id: string;
  companyId: string;
  propertyId: string;
  threadId: string;
  module: YwServiceModule;
  question: string;
  intakeType: 'service_request' | 'job_inquiry';
  reviewNote: string;
}

/** Fabricated service inquiries linked to the existing fictional YW inbox. No PMS client exists here. */
export const ywInquiryFixtures: readonly YwInquiryFixture[] = [
  {
    id: 'yw-demo-snow', companyId: 'yard-rosevear-demo', propertyId: 'yw-village-demo', threadId: 'yw-sms',
    module: 'snow_removal', question: 'Upcoming plow visit after snowfall', intakeType: 'service_request',
    reviewNote: 'Staff must check contract coverage, storm event, safe access and crew schedule before responding.'
  },
  {
    id: 'yw-demo-septic', companyId: 'yard-rosevear-demo', propertyId: 'yw-farm-road-demo', threadId: 'yw-voicemail',
    module: 'septic_services', question: 'Urgent septic service triage', intakeType: 'service_request',
    reviewNote: 'Escalate to authorized staff to verify safety, licensed service capacity and disposal requirements. No automatic dispatch.'
  },
  {
    id: 'yw-demo-garbage', companyId: 'yard-rosevear-demo', propertyId: 'yw-farm-road-demo', threadId: 'yw-web',
    module: 'rural_garbage', question: 'Stickers versus seasonal contract', intakeType: 'job_inquiry',
    reviewNote: 'Check collection route, sticker rules, contract terms and current pricing before quoting.'
  },
  {
    id: 'yw-demo-lawn', companyId: 'yard-rosevear-demo', propertyId: 'yw-village-demo', threadId: 'yw-email',
    module: 'lawn_grounds', question: 'Annual grounds maintenance renewal', intakeType: 'job_inquiry',
    reviewNote: 'Check approved services, site history, seasonal timing and any proposed renewal terms.'
  },
  {
    id: 'yw-demo-tree-held', companyId: 'yard-rosevear-demo', propertyId: 'yw-village-demo', threadId: 'yw-internal',
    module: 'arboriculture', question: 'Tree-care module unavailable example', intakeType: 'job_inquiry',
    reviewNote: 'This mock module is intentionally disabled. No customer record or work order can be created.'
  }
];

export interface YwHandoffPreview {
  reference: string;
  companyId: string;
  companyName: string;
  propertyId: string;
  propertyLabel: string;
  threadId: string;
  sourceSubject: string;
  module: YwServiceModule;
  question: string;
  intakeType: 'service_request' | 'job_inquiry';
  reviewNote: string;
  operatorApproval: 'required';
  propertyVerified: 'not_verified';
  crewAvailability: 'not_checked';
  estimate: 'not_issued';
  workOrder: 'not_created';
  dispatch: 'not_scheduled';
  billing: 'not_updated';
  communication: 'not_sent';
}
export type YwHandoffResult =
  | { ok: true; preview: YwHandoffPreview }
  | { ok: false; reason: 'wrong_organization' | 'unknown_company' | 'unknown_property' | 'property_tenant_mismatch' | 'unknown_sample' | 'company_tenant_mismatch' | 'property_mismatch' | 'module_disabled' | 'source_disallowed' };

/** Company, property, module and source must all match. This never fetches or writes PMS data. */
export function previewYwHandoff(organizationId: OrganizationId, contract: ConnectorContract, companyId: string, propertyId: string, fixtureId: string): YwHandoffResult {
  if (organizationId !== 'yw' || contract !== connectorContracts.yw || contract.organizationId !== organizationId || contract.state !== 'mock_only') return { ok: false, reason: 'wrong_organization' };
  const company = ywDemoCompanies.find((item) => item.id === companyId);
  if (!company) return { ok: false, reason: 'unknown_company' };
  const property = ywDemoProperties.find((item) => item.id === propertyId);
  if (!property) return { ok: false, reason: 'unknown_property' };
  if (property.companyId !== companyId) return { ok: false, reason: 'property_tenant_mismatch' };
  const fixture = ywInquiryFixtures.find((item) => item.id === fixtureId);
  if (!fixture) return { ok: false, reason: 'unknown_sample' };
  if (fixture.companyId !== companyId) return { ok: false, reason: 'company_tenant_mismatch' };
  if (fixture.propertyId !== propertyId) return { ok: false, reason: 'property_mismatch' };
  if (!company.enabledModules.includes(fixture.module)) return { ok: false, reason: 'module_disabled' };
  const source = inboxForOrganization('yw').find((item) => item.organizationId === organizationId && item.id === fixture.threadId && contract.approvedChannels.includes(item.channel));
  if (!source) return { ok: false, reason: 'source_disallowed' };
  return { ok: true, preview: {
    reference: `DEMO-${fixture.id.toUpperCase()}`, companyId, companyName: company.name, propertyId, propertyLabel: property.label,
    threadId: source.id, sourceSubject: source.subject, module: fixture.module, question: fixture.question,
    intakeType: fixture.intakeType, reviewNote: fixture.reviewNote, operatorApproval: 'required',
    propertyVerified: 'not_verified', crewAvailability: 'not_checked', estimate: 'not_issued',
    workOrder: 'not_created', dispatch: 'not_scheduled', billing: 'not_updated', communication: 'not_sent'
  } };
}
