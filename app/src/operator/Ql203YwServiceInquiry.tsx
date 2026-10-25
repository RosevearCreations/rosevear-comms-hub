import { useState } from 'react';
import { connectorContracts } from './ql199ConnectorContracts';
import { previewYwHandoff, ywDemoCompanies, ywDemoProperties, ywInquiryFixtures, ywModuleLabels, type YwHandoffPreview } from './ql203YwConnector';
import './ql203-yw-connector.css';

export function Ql203YwServiceInquiry({ onOpenThread }: { onOpenThread: (threadId: string) => void }) {
  const [companyId, setCompanyId] = useState(ywDemoCompanies[0].id);
  const [propertyId, setPropertyId] = useState(ywInquiryFixtures[0].propertyId);
  const [fixtureId, setFixtureId] = useState(ywInquiryFixtures[0].id);
  const [preview, setPreview] = useState<YwHandoffPreview | null>(null);
  const [rejection, setRejection] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const tenant = ywDemoCompanies.find((item) => item.id === companyId)!;
  const properties = ywDemoProperties.filter((item) => item.companyId === companyId);

  function inspect() {
    const result = previewYwHandoff('yw', connectorContracts.yw, companyId, propertyId, fixtureId);
    setPreview(result.ok ? result.preview : null);
    setRejection(result.ok ? '' : result.reason === 'module_disabled'
      ? 'This service module is disabled in the fictional company. No handoff was prepared.'
      : 'Company, property or source permission did not match. No cross-tenant property information was shown.');
  }

  return <section className="ql203-yw" data-ql203-release="ql203-yw-property-service-mock-v1" aria-labelledby="ql203-heading">
    <header className="ql203-head"><div><p className="ql191-eyebrow">QL-203 · YW mock connector</p><h4 id="ql203-heading">Property service request & job inquiry</h4><p>Review fictional Yard Rosevear inquiries before any property-maintenance handoff.</p></div><button type="button" className="ql191-help-button" aria-expanded={helpOpen} aria-controls="ql203-help" onClick={() => setHelpOpen((value) => !value)}>ⓘ Help</button></header>
    <p className="ql203-alert" role="note">PMS DISCONNECTED · No property is verified, crew scheduled, estimate issued, work order created, invoice changed, or customer message sent.</p>
    {helpOpen && <p id="ql203-help" className="ql203-help" role="note">These company, property and service-module records are fictional. Real YW intake requires private-server authentication, tenant-scoped property ownership, enabled service-module permissions and owner-approved work-order controls. Even urgent septic questions remain staff triage only; the sample inbox does not dispatch a crew.</p>}
    <div className="ql203-layout">
      <div className="ql203-form">
        <label htmlFor="ql203-company">Demo YW company</label><select id="ql203-company" value={companyId} onChange={(event) => { const nextId = event.target.value; setCompanyId(nextId); setPropertyId(ywDemoProperties.find((item) => item.companyId === nextId)?.id ?? ''); setPreview(null); setRejection(''); }}>{ywDemoCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
        <label htmlFor="ql203-property">Demo property</label><select id="ql203-property" value={propertyId} onChange={(event) => { setPropertyId(event.target.value); setPreview(null); setRejection(''); }}>{properties.map((property) => <option key={property.id} value={property.id}>{property.label}</option>)}</select>
        <label htmlFor="ql203-inquiry">Fictional intake sample</label><select id="ql203-inquiry" value={fixtureId} onChange={(event) => { const nextId = event.target.value; setFixtureId(nextId); const fixture = ywInquiryFixtures.find((item) => item.id === nextId); if (fixture?.companyId === companyId) setPropertyId(fixture.propertyId); setPreview(null); setRejection(''); }}>{ywInquiryFixtures.map((item) => <option key={item.id} value={item.id}>{ywModuleLabels[item.module]} · {item.question}</option>)}</select>
        <button type="button" onClick={inspect}>Preview YW service handoff</button>
      </div>
      <aside className="ql203-modules" aria-label="Fictional module eligibility"><h5>Demo company module registry</h5><ul>{(Object.entries(ywModuleLabels) as [keyof typeof ywModuleLabels, string][]).map(([module, label]) => <li key={module}><span>{label}</span><strong>{tenant.enabledModules.includes(module) ? 'Enabled in demo' : 'Disabled in demo'}</strong></li>)}</ul><p>These switches are examples only; they do not reflect or change any actual YW tenant.</p></aside>
    </div>
    {rejection && <p className="ql203-alert" role="alert">{rejection}</p>}
    {preview ? <div className="ql203-result" role="status" aria-live="polite"><h5>Staff review required — fictional YW handoff</h5><dl>
      <div><dt>Reference</dt><dd>{preview.reference}</dd></div><div><dt>Company</dt><dd>{preview.companyName}</dd></div><div><dt>Property</dt><dd>{preview.propertyLabel}</dd></div><div><dt>Service module</dt><dd>{ywModuleLabels[preview.module]}</dd></div><div><dt>Inquiry type</dt><dd>{preview.intakeType === 'job_inquiry' ? 'Job inquiry' : 'Service request'}</dd></div><div><dt>Source</dt><dd>{preview.sourceSubject}</dd></div><div><dt>Request</dt><dd>{preview.question}</dd></div><div className="ql203-wide"><dt>Required operator review</dt><dd>{preview.reviewNote}</dd></div>
      <div><dt>Property verified</dt><dd>No</dd></div><div><dt>Crew availability</dt><dd>Not checked</dd></div><div><dt>Estimate</dt><dd>Not issued</dd></div><div><dt>Work order</dt><dd>Not created</dd></div><div><dt>Dispatch</dt><dd>Not scheduled</dd></div><div><dt>Billing</dt><dd>Not updated</dd></div><div><dt>Customer reply</dt><dd>Not sent</dd></div>
    </dl><button type="button" onClick={() => onOpenThread(preview.threadId)}>View fictional source conversation</button></div> : <p className="ql203-empty" role="status">Choose a fictional property request to inspect. All real PMS actions are on hold.</p>}
  </section>;
}
