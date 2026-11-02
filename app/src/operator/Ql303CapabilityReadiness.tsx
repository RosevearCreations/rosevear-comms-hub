import {useState} from 'react';
import {QL303_ROWS,QL303_GATES,ql303AgeDays,ql303Classify,ql303ImmutableProofUrl,ql303NotificationCandidate} from './ql303CapabilityReadiness';
import type {Ql270SourceId} from './ql270ConnectionCentre';
import './ql303-capability-readiness.css';

const labels={MISSING_404:'HTTP 404 · missing',PUBLIC_FILE_PRESENT_UNVERIFIED:'HTTP 200 · present, unverified',GITHUB_RATE_LIMITED_OR_FORBIDDEN:'HTTP 401/403/429 · blocked',PUBLIC_CHECK_ERROR:'Public check error',NETWORK_ERROR:'Network error',NOT_CHECKED:'Not checked',CHECKING:'Checking'} as const;

export function Ql303CapabilityReadiness(){
  const [selected,setSelected]=useState<Ql270SourceId>('rosiedazzlers');
  const [reviewed,setReviewed]=useState<Ql270SourceId[]>([]);
  const [clock]=useState(()=>new Date());
  const candidate=ql303NotificationCandidate(selected,undefined,clock);

  return <section className="ql303" data-ql303-release="six-app-proof-review-v1" aria-labelledby="ql303-title">
    <header><div><p className="ql271-eyebrow">QL-303 · Six-app integration assurance</p><h3 id="ql303-title">Capability readiness & immutable proof drift</h3><p>Six registered source roles: four independent business apps, one shared reporting service and one private edge service. A known mapping is not a granted capability.</p></div><strong>0 / 6 CONNECTED · HOLD</strong></header>
    <p className="ql303-warning" role="note">Six unauthenticated public immutable-file lookups were independently performed for this build; their actual observation time is recorded below. Links require a deliberate visit; this app does not perform network requests or silently refresh evidence. A 200 response means a file exists—not a validated signature or authorization. No private gateway GET, connection, customer read, source write, owner notification or ACK delivery is enabled.</p>
    <div className="ql303-gates" aria-label="Required authorization gates">{QL303_GATES.map(gate=><div key={gate.id}><span>{gate.label}</span><strong>{gate.state}</strong></div>)}</div>
    <div className="ql303-table-wrap"><table><caption>Source readiness and dated immutable public proof observations</caption><thead><tr><th scope="col">App / role</th><th scope="col">Capability & access</th><th scope="col">Immutable proof status</th><th scope="col">Age / drift</th><th scope="col">Public recheck</th></tr></thead><tbody>{QL303_ROWS.map(row=>{
      const status=ql303Classify(row.observedHttp);
      const at=row.observedAt;
      const age=ql303AgeDays(at,clock);
      return <tr key={row.id}><th scope="row"><strong>{row.label}</strong><small>{row.kind} · {row.repo}</small></th><td><strong>{row.capability}</strong><small>{row.permission} · 0/{row.requiredGates} gates · HOLD</small></td><td><strong>{labels[status]}</strong><small>Independent QL-303 public lookup · <time dateTime={at}>{at}</time><br />Prior QL-290: {row.historicalHttp} · {row.historicalAt}</small></td><td><strong>{age===null?'Age unavailable':`${age} full days`}</strong><small>{age===null?'Clock mismatch':age>=1?'STALE · review required':'Same-day observation'}</small></td><td><a href={ql303ImmutableProofUrl(row.id)} target="_blank" rel="noopener noreferrer" aria-label={`View immutable public proof URL for ${row.label}`}>Inspect pinned public source ↗</a></td></tr>;
    })}</tbody></table></div>
    <div className="ql303-notify"><div><p className="ql271-eyebrow">Owner notification review · session only</p><h4>Local notification candidate — never sent</h4><p>Review the factual blocker text and owner role. No recipient address is resolved, and reviewing does not deliver a message.</p><label htmlFor="ql303-owner">Source to review</label><select id="ql303-owner" value={selected} onChange={e=>setSelected(e.target.value as Ql270SourceId)}>{QL303_ROWS.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select><button type="button" onClick={()=>setReviewed(previous=>previous.includes(selected)?previous:[...previous,selected])}>Mark reviewed locally</button><p aria-live="polite">{reviewed.includes(selected)?'Reviewed in this tab · still UNSENT':'Pending local review · UNSENT'} · 0 delivery attempts</p></div><div className="ql303-preview"><small>{candidate.priority} · {candidate.recipientRole}</small><h5>{candidate.subject}</h5><p>{candidate.body}</p></div></div>
    <p className="ql303-warning">ACK delivery evidence: UNDER_REVIEW / PARKED_FOR_LATER. TEST authorization: NOT GIVEN. Six connections: DISCONNECTED / HOLD.</p>
  </section>;
}
