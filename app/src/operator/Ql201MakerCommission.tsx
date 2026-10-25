import { useState } from 'react';
import { connectorContracts } from './ql199ConnectorContracts';
import { makerIntakeFixtures, previewMakerHandoff, type MakerHandoffPreview } from './ql201DevilNDoveConnector';
import './ql201-maker-connector.css';

export function Ql201MakerCommission({ onOpenThread }: { onOpenThread: (threadId: string) => void }) {
  const [fixtureId, setFixtureId] = useState(makerIntakeFixtures[0].id);
  const [preview, setPreview] = useState<MakerHandoffPreview | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  function inspect() {
    const result = previewMakerHandoff('devilndove', connectorContracts.devilndove, fixtureId);
    setPreview(result.ok ? result.preview : null);
  }
  return <section className="ql201-maker" data-ql201-release="ql201-devilndove-commission-mock-v1" aria-labelledby="ql201-title">
    <header className="ql201-head"><div><p className="ql191-eyebrow">QL-201 · Devil n Dove mock connector</p><h4 id="ql201-title">Custom order and commission handoff</h4><p>Inspect fictional workshop intake requirements before a maker reviews a proposal.</p></div><button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql201-help" onClick={() => setShowHelp((shown) => !shown)}>ⓘ Help</button></header>
    <p className="ql201-alert" role="note">SHOP DISCONNECTED · No Etsy listing, inventory allocation, media import, order, payment or production work is created here.</p>
    {showHelp && <p id="ql201-help" className="ql201-help" role="note">Choose a made-up custom resin or wax-carved ring inquiry. The preview records only fixed sample fields. The source button opens a fictional inbox thread. Maker sign-off, material costs, design approval, delivery dates, Canada-only shipping eligibility and selling-channel requirements must be checked separately.</p>}
    <div className="ql201-form"><label htmlFor="ql201-fixture">Fictional maker inquiry</label><select id="ql201-fixture" value={fixtureId} onChange={(event) => { setFixtureId(event.target.value); setPreview(null); }}>{makerIntakeFixtures.map((item) => <option key={item.id} value={item.id}>{item.kind === 'custom_order' ? 'Custom order' : 'Commission'} · {item.project}</option>)}</select><button type="button" onClick={inspect}>Preview maker handoff</button></div>
    {preview ? <div className="ql201-result" role="status" aria-live="polite"><h5>Maker approval required — sample only</h5><dl>
      <div><dt>Reference</dt><dd>{preview.reference}</dd></div><div><dt>Request</dt><dd>{preview.kind === 'custom_order' ? 'Custom order' : 'Commission'}</dd></div><div><dt>Source</dt><dd>{preview.sourceSubject}</dd></div><div><dt>Project</dt><dd>{preview.project}</dd></div><div><dt>Technique</dt><dd>{preview.technique}</dd></div><div><dt>Materials</dt><dd>{preview.materialNote}</dd></div><div><dt>Deadline</dt><dd>{preview.deadlineNote}</dd></div><div><dt>Operator review</dt><dd>{preview.reviewNote}</dd></div>
      <div><dt>Quote</dt><dd>Not created</dd></div><div><dt>Inventory</dt><dd>Not reserved</dd></div><div><dt>Production</dt><dd>Not started</dd></div><div><dt>Media</dt><dd>Not imported</dd></div><div><dt>Listing</dt><dd>Not published</dd></div><div><dt>Payment</dt><dd>Not requested</dd></div><div><dt>Reply</dt><dd>Not sent</dd></div>
    </dl><button type="button" onClick={() => onOpenThread(preview.threadId)}>View fictional source conversation</button></div> : <p className="ql201-empty" role="status">Choose a sample and preview its maker handoff. Nothing has been submitted.</p>}
  </section>;
}
