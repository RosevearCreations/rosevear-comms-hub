import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { emptyQl297Session, ql297Apply, ql297ForOrganization, ql297Timeline, type Ql297Channel } from './ql297Omnichannel';
import './ql297-omnichannel.css';

type Filter = 'all' | Ql297Channel | 'failed';
export function Ql297Omnichannel({ organization }: { organization: OperatorOrganization }) {
  const events = ql297ForOrganization(organization.id);
  const [session, setSession] = useState(() => emptyQl297Session(organization.id));
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? '');
  const [filter, setFilter] = useState<Filter>('all');
  const [help, setHelp] = useState(false);
  const selected = events.find((event) => event.id === selectedId) ?? events[0];
  const timeline = ql297Timeline(session, organization.id);
  const visible = timeline.filter((event) => filter === 'all' || (filter === 'failed' ? ['FAILED_MOCK', 'BLOCKED_MOCK'].includes(event.outcome) : event.channel === filter));
  return <section className="ql297" data-ql297-release="omnichannel-event-replay-v1" aria-labelledby="ql297-heading">
    <header><div><p className="ql191-eyebrow">QL-297 · Source-explained event lab</p><h3 id="ql297-heading">{organization.name} · Omnichannel timeline</h3><p>Review fictional incoming events, delivery failures and safe replay recovery across five channels.</p></div><button type="button" aria-expanded={help} onClick={() => setHelp((value) => !value)}>ⓘ Help</button></header>
    {help && <p role="note">Replay adds exactly one mock receipt by source ID. Replaying it again is ignored. Only a failed receipt may receive one simulated recovery step; blocked events require manual review. This activity stays in this browser tab and resets with the company.</p>}
    <p className="ql297-warning" role="note">DISABLED SYNTHETIC PREVIEW · No phone provider, email account, webhook, callback, recording, real customer data, outbound message, AI auto-send, database or browser storage. Six supporting integrations remain disconnected.</p>
    <div className="ql297-stats" aria-label="Simulated event counts"><div><strong>{events.length}</strong><span>Available fixtures</span></div><div><strong>{session.receipts.filter((r) => r.attempt === 1).length}</strong><span>Accepted originals</span></div><div><strong>{session.receipts.filter((r) => r.attempt === 2).length}</strong><span>Local recoveries</span></div><div><strong>0</strong><span>Real deliveries</span></div></div>
    <div className="ql297-layout"><section aria-label="Synthetic replay controls"><h4>1 · Choose a fictional event</h4><label htmlFor="ql297-event">Checked-in source fixture</label><select id="ql297-event" value={selected?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)}>{events.map((event) => <option key={event.id} value={event.id}>{event.channel} · {event.label}</option>)}</select>
      {selected && <dl className="ql297-meta"><div><dt>Source provenance</dt><dd>{selected.source}</dd></div><div><dt>Mock status</dt><dd>{selected.delivery}</dd></div><div><dt>Error code</dt><dd>{selected.errorCode ?? 'None'}</dd></div><div><dt>Operator guidance</dt><dd>{selected.recoveryHint}</dd></div></dl>}
      <div className="ql297-actions"><button type="button" onClick={() => setSession((s) => ql297Apply(s, organization.id, selected.id, 'replay'))}>Replay mock event</button><button type="button" disabled={selected?.delivery !== 'FAILED_MOCK'} onClick={() => setSession((s) => ql297Apply(s, organization.id, selected.id, 'recover'))}>Rehearse failed-event recovery</button><button type="button" onClick={() => { setSession(emptyQl297Session(organization.id)); setFilter('all'); }}>Clear local timeline</button></div>
      <p className="ql297-result" role="status" aria-live="polite">{session.lastAction}</p></section>
      <section aria-label="Source-linked synthetic event timeline"><div className="ql297-feed-head"><h4>2 · Unified event timeline</h4><label htmlFor="ql297-filter">Filter timeline<select id="ql297-filter" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="all">All channels</option><option value="phone">Phone</option><option value="sms">SMS</option><option value="email-style">Email-style</option><option value="voicemail">Voicemail</option><option value="missed-call">Missed calls</option><option value="failed">Failed / blocked</option></select></label></div>
        <p role="status">{visible.length} visible of {timeline.length} mock receipt entries</p>{visible.length ? <ol className="ql297-feed">{visible.map((event) => <li key={event.replayKey}><strong>{event.channel.toUpperCase()} · {event.label}</strong><span className={event.outcome === 'RECOVERED_MOCK' ? 'ql297-recovered' : ''}>{event.outcome}</span><small>{event.occurredAt} · attempt {event.attempt} · {event.errorCode ?? 'No error'}</small><small>Source: {event.source}</small><small>Replay key: {event.replayKey}</small><p>{event.recoveryHint}</p></li>)}</ol> : <p className="ql297-empty">No matching mock receipts. Replay a checked-in example to begin.</p>}</section></div>
    <p className="ql297-warning">SIMULATED REPLAY ONLY · NO CUSTOMER SEND · NO PROVIDER RETRY · NO WEBHOOK OR LIVE DATA ACCESS</p>
  </section>;
}
