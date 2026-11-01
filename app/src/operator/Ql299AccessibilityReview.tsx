import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { ql299Checks, ql299Devices, ql299Key, ql299Summary, ql299Update, type Ql299Device, type Ql299Disposition, type Ql299Ledger } from './ql299AccessibilityReview';
import './ql299-accessibility-review.css';

const labels: Record<Ql299Disposition, string> = { unreviewed: 'Not reviewed', reproduced_locally: 'Locally reproduced', needs_owner_retest: 'Owner retest needed', deferred: 'Deferred for follow-up' };

export function Ql299AccessibilityReview({ organization }: { organization: OperatorOrganization }) {
  const [device, setDevice] = useState<Ql299Device>('desktop');
  const [ledger, setLedger] = useState<Ql299Ledger>({});
  const summary = ql299Summary(ledger, organization.id);
  return <section className="ql299" aria-labelledby="ql299-title" data-ql299-release="local-accessibility-regression-v1">
    <header><p className="ql191-eyebrow">QL-299 · Operator accessibility owner walkthrough</p><h3 id="ql299-title">{organization.name} · Cross-device regression queue</h3><p>Reproducible walkthrough cards for desktop, tablet and mobile. This is a local checklist, not an automated accessibility certification or owner acceptance record.</p></header>
    <p className="ql299-warning" role="note"><strong>OWNER EVIDENCE: NOT VERIFIED.</strong> No real operator observations or sign-off are recorded here. Local dispositions are ephemeral and cannot approve a release, provider integration or tenant access. Six supporting apps remain disconnected.</p>
    <div className="ql299-overview" role="status" aria-live="polite" aria-atomic="true"><strong>{summary.unreviewed} of {summary.total} checks not reviewed</strong><span>{summary.reproduced} locally reproduced · {summary.ownerRetest} owner retest needed · {summary.deferred} deferred</span><span>Verified owner findings: {summary.ownerVerified} · accepted sign-offs: 0</span></div>
    <fieldset className="ql299-devices"><legend>Review device profile (manual viewport required)</legend>{ql299Devices.map((entry) => <label key={entry}><input type="radio" name={`ql299-device-${organization.id}`} value={entry} checked={device === entry} onChange={() => setDevice(entry)} />{entry[0].toUpperCase() + entry.slice(1)}</label>)}</fieldset>
    <p className="ql299-guidance">Set your actual browser viewport to {device === 'desktop' ? '1280px or wider' : device === 'tablet' ? '768–1024px' : '320–430px'}; selecting a profile does not resize the browser or prove a device was tested. Use real keyboard, zoom and assistive-technology checks before recording any findings outside this simulation.</p>
    <ol className="ql299-list">{ql299Checks.map((check) => {
      const current = ledger[organization.id]?.[ql299Key(device, check.id)] ?? 'unreviewed';
      return <li key={check.id}><article aria-labelledby={`ql299-${check.id}`}><div className="ql299-card-heading"><h4 id={`ql299-${check.id}`}>{check.label}</h4><span>{labels[current]}</span></div><p><strong>Reproduce:</strong> {check.steps}</p><p><strong>Expected:</strong> {check.expected}</p><label>Local review disposition<select aria-label={`${device} ${check.label} disposition`} value={current} onChange={(event) => setLedger((previous) => ql299Update(previous, organization.id, device, check.id, event.target.value as Ql299Disposition))}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></article></li>;
    })}</ol>
    <footer><button type="button" onClick={() => setLedger((previous) => ({ ...previous, [organization.id]: {} }))}>Clear {organization.name} local review queue</button><p>All 15 cases are initially unreviewed. No storage, export, network request, production mutation or fabricated owner evidence.</p></footer>
  </section>;
}
