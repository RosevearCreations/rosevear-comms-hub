import {useState} from 'react';
import {QL309_PACKET_ROWS,QL309_REQUIRED_EVIDENCE,ql309PacketText,ql309PreflightPacket,ql309PreflightSummary,ql309RecordLocalReview,type Ql309LocalEntry,type Ql309ReviewDisposition} from './ql309PilotPreflight';
import type {Ql270SourceId} from './ql270ConnectionCentre';
import './ql309-pilot-preflight.css';

const dispositionOptions=[
  {id:'AWAITING_EXTERNAL_EVIDENCE',label:'Awaiting independent evidence'},
  {id:'REFER_TO_INDEPENDENT_REVIEWER',label:'Refer for independent reviewer verification'},
  {id:'OWNER_DECISION_REQUIRED',label:'Return to owner for a separate TEST-only decision'}
] as const;

export function Ql309PilotPreflight(){
  const [source,setSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [reference,setReference]=useState('');
  const [disposition,setDisposition]=useState<Ql309ReviewDisposition>('AWAITING_EXTERNAL_EVIDENCE');
  const [entries,setEntries]=useState<Ql309LocalEntry[]>([]);
  const [error,setError]=useState('');
  const local=entries.find(row=>row.source===source);
  const packet=ql309PreflightPacket(source,local);
  const summary=ql309PreflightSummary(entries);
  function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const result=ql309RecordLocalReview(entries,source,reference,disposition);setError(result.error??'');if(!result.error){setEntries([...result.entries]);setReference('');}}

  return <section className="ql309" data-ql309-release="pilot-preflight-no-go-v1" aria-labelledby="ql309-title">
    <header><div><p className="ql271-eyebrow">QL-309 · isolated read-only pilot planning</p><h3 id="ql309-title">Nonproduction pilot preflight decision packet</h3><p>A complete NO-GO readback for six source roles. A released UI, mock contract or entered reference never authorizes a TEST credential or gateway request.</p></div><strong>NO-GO · HOLD</strong></header>
    <div className="ql309-metrics" aria-label="Pilot preflight results"><div><strong>{summary.missingProofs} / {summary.sources}</strong><span>Immutable proofs missing</span></div><div><strong>{summary.independentlyVerified}</strong><span>Independently accepted proofs</span></div><div><strong>{summary.ownerApproved}</strong><span>Owner TEST approvals</span></div><div><strong>{summary.sourceGETs}</strong><span>Private source GETs</span></div></div>
    <p className="ql309-warning" role="note">QL-307 observed six 404s at pinned public paths. QL-308 proved only 28 synthetic contract shapes/denials. To contemplate any future GET, we still need original signed Proof-B, verified issuer/reviewer/witness custody, independent tenant authorization, a scoped GET identity and a separate explicit owner TEST decision. All six integrations remain DISCONNECTED / HOLD; ACK delivery remains UNDER_REVIEW / PARKED_FOR_LATER.</p>
    <div className="ql309-table"><table><caption>Six application preflight outcome register</caption><thead><tr><th scope="col">Source / role</th><th scope="col">Tenant model</th><th scope="col">Original proof</th><th scope="col">Release decision</th></tr></thead><tbody>{QL309_PACKET_ROWS.map(row=><tr key={row.id}><th scope="row">{row.label}<small>{row.kind}</small></th><td>{row.fixtureAlias??'Supporting role · no customer tenant'}</td><td>HTTP {row.proofHttp}<small>{row.proofAt}</small></td><td><strong>NO-GO · {row.connection}</strong><small>0/{row.requiredGates} accepted gates</small></td></tr>)}</tbody></table></div>
    <div className="ql309-layout"><form onSubmit={submit}><h4>Local decision-review handoff</h4><p>Record an internal nonsecret case reference and a follow-up route. This is a local draft only—not an owner signature, reviewer attestation or delivered notification.</p><label htmlFor="ql309-source">Source to review</label><select id="ql309-source" value={source} onChange={event=>{setSource(event.target.value as Ql270SourceId);setError('');}}>{QL309_PACKET_ROWS.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select><label htmlFor="ql309-disposition">Local follow-up route</label><select id="ql309-disposition" value={disposition} onChange={event=>setDisposition(event.target.value as Ql309ReviewDisposition)}>{dispositionOptions.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select><label htmlFor="ql309-reference">Nonsecret case reference</label><input id="ql309-reference" value={reference} onChange={event=>setReference(event.target.value)} autoComplete="off" maxLength={40} placeholder="PREFLIGHT_309_A" aria-describedby="ql309-help"/><small id="ql309-help">5–40 letters, numbers, dashes or underscores. Never paste credentials, signed proof, personal details or private gateway URLs.</small><button type="submit">Record local NO-GO review</button><p role="status" aria-live="polite">{error||(local?`Source has a local follow-up: ${local.disposition}. Still NO-GO.`:'No source-specific local review yet. All six remain NO-GO.')}</p></form>
    <div className="ql309-inspector"><h4>Five required independent gates</h4><p>{packet.label} · {packet.kind} · {packet.fixtureAlias??'No customer tenant'}</p><ol>{QL309_REQUIRED_EVIDENCE.map(item=><li key={item.id}><strong>{item.title}</strong><span>NOT VERIFIED</span><small>{item.reason}</small></li>)}</ol><p className="ql309-warning">Decision: {packet.outcome}. Credential present: NO. Browser requests: {packet.requestCount}. Approved owner decision: NO.</p></div></div>
    <div className="ql309-packet"><h4>Unsent decision packet preview</h4><p>A plain-text readback for manual, independent review. It is never submitted by this application.</p><textarea aria-label="Unsent preflight packet preview" readOnly value={ql309PacketText(source,local)} rows={12}/></div>
  </section>;
}
