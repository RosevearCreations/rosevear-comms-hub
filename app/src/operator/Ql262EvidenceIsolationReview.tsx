import {useState,type FormEvent} from 'react';
import {QL258_APPS,type Ql258App} from './ql258OwnerActionChecklist';
import {type Ql259Ledger} from './ql259SixAppReturnReconciliation';
import {QL262_RELEASE,QL262_OBSERVED,QL262_ISOLATION_OPTIONS,
  intakeQl262OwnerPacket,newQl262IsolationLedger,ql262SetIsolation,
  ql262EvidenceLedger,ql262FreshPublicProofCheck,
  type Ql262IsolationDecision,type Ql262PublicResult}
  from './ql262EvidenceIsolationFreshness';

const RECEIPTS={
  ACCEPTED_SELF_REPORTED_HELD:'Recorded exact original owner JSON format. This is an unverified self-report only.',
  REJECTED_UNSAFE_OR_INVALID_PACKET:'Rejected unsafe, changed or invalid packet. No approvals or secrets accepted.',
  DUPLICATE_IDENTICAL_NO_CHANGE_HELD:'Duplicate exact owner packet; no new evidence.',
  CONFLICT_REQUIRES_CLEAR_HELD:'Conflicting owner packet. Clear the selected app before importing a replacement.'
} as const;

export function Ql262EvidenceIsolationReview(){
  const [owners,setOwners]=useState<Ql259Ledger>({});
  const [raw,setRaw]=useState('');
  const [selected,setSelected]=useState<Ql258App>('yw');
  const [isolation,setIsolation]=useState(newQl262IsolationLedger);
  const [checks,setChecks]=useState<ReadonlyArray<Ql262PublicResult>|null>(null);
  const [checkedAt,setCheckedAt]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [reviewRun,setReviewRun]=useState(false);
  const data=ql262EvidenceLedger(owners,isolation,checks);

  function importOwner(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const result=intakeQl262OwnerPacket(owners,raw);
    setOwners(result.ledger);setRaw('');setReviewRun(false);
    setMessage(RECEIPTS[result.status]);
  }
  async function refreshPublicSource(){
    setBusy(true);setChecks(null);setCheckedAt('');
    setMessage('Checking current public GitHub main SHAs, then pinned original proof files…');
    try{
      const result=await ql262FreshPublicProofCheck();
      setChecks(result);setCheckedAt(new Date().toISOString());
      setMessage('Public GitHub freshness test completed. HTTP 200 is only file availability, never verified signature/custody or owner TEST approval.');
    }catch{
      setMessage('Could not finish public GitHub check. Unknown evidence stays HELD.');
    }finally{setBusy(false);}
  }
  async function copyReport(){
    try{await navigator.clipboard.writeText(JSON.stringify({...data,
      publicCheckObservedAt:checkedAt||null},null,2));
      setMessage('Sanitized report copied. No private signer or test permission is attested.');
    }catch{setMessage('Copy unavailable; use the read-only report text below.');}
  }

  return <section className="ql245-panel" data-ql262-release={QL262_RELEASE}
    aria-labelledby="ql262-title">
    <h4 id="ql262-title">QL-262 · Six original receipts, isolation decision ledger and fresh signed-proof watch (HELD)</h4>
    <p>Last public baseline: <strong>{QL262_OBSERVED}</strong> — six original proof paths were
      HTTP 404 at their immutable source commits. No new authenticated custodian,
      reviewer, genuine signed proof or separate owner TEST authorization was supplied
      in this build request. A self-report can be recorded but <strong>cannot release a gate</strong>.</p>
    <form className="ql245-form" onSubmit={importOwner}>
      <label htmlFor="ql262-owner-json">Original unmodified QL-258 owner-status JSON (one app)
        <textarea id="ql262-owner-json" rows={5} maxLength={12000} required value={raw}
          onChange={event=>setRaw(event.target.value)}
          placeholder="Exact nonsecret QL-258 JSON only. Never enter owner identities, signer keys, witness nonces, private endpoints or passwords." />
      </label>
      <div className="ql245-actions"><button type="submit">Validate owner packet · unverified</button>
        <button type="button" onClick={()=>{
          setReviewRun(true);setMessage('Six-app local evidence decision review completed: all private security, nonproduction and network approval gates still HELD.');
        }}>Run six-app isolation and receipt audit (offline)</button>
        <button type="button" disabled={busy} onClick={()=>void refreshPublicSource()}>
          {busy?'Checking GitHub…':'Test current main + original proof (public GET only)'}
        </button></div>
    </form>
    <p><strong>Public freshness test:</strong> six anonymous GitHub API reads of the
      current <code>main</code> commit, followed only by source-proof GETs pinned to those
      returned immutable SHAs. Errors and invalid SHAs are UNKNOWN. A visible proof
      file still needs external signature, CI, source A→B and public pin verification.
      No companion endpoint, home network, production data or private gateway is contacted.</p>
    <div className="ql262-isolation-controls">
      <label htmlFor="ql262-selected-app">Choose app to record an owner-only isolation decision
        <select id="ql262-selected-app" value={selected}
          onChange={event=>setSelected(event.target.value as Ql258App)}>
          {QL258_APPS.map(app=><option key={app.system} value={app.system}>{app.name}</option>)}
        </select>
      </label>
      <label htmlFor="ql262-isolation-decision">What do we actually know? (not independently verified here)
        <select id="ql262-isolation-decision" value={isolation[selected]}
          onChange={event=>{
            setIsolation(previous=>ql262SetIsolation(previous,selected,event.target.value as Ql262IsolationDecision));
            setReviewRun(false);
            setMessage('Recorded owner-reported isolation disposition only; no independently verified tenant or network TEST authorization.');
          }}>
          {QL262_ISOLATION_OPTIONS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <button type="button" onClick={()=>{
        setOwners(previous=>{const next={...previous};delete next[selected];return next;});
        setReviewRun(false);setMessage('Cleared selected app owner JSON only; other app records preserved.');
      }}>Clear selected original packet</button>
    </div>
    {message&&<p role="status" className="ql245-message">{message}</p>}
    <div className="ql245-scroll"><table>
      <caption>Original public proof status and owner reports only; no independently authenticated source approvals.</caption>
      <thead><tr><th scope="col">Source app</th><th scope="col">Original owner packet</th>
        <th scope="col">Nonproduction decision</th><th scope="col">Fresh source</th>
        <th scope="col">Public proof</th><th scope="col">Actual test authorization</th></tr></thead>
      <tbody>{data.rows.map(row=><tr key={row.system}>
        <th scope="row">{row.name}</th><td>{row.packet}</td>
        <td>{row.isolatedNonproductionDecision}{row.dedicatedTenantProofNeeded?' · independent tenant required':''}</td>
        <td>{row.currentSourceSha?.slice(0,12)??'NOT_RECHECKED'} / {row.publicSourceFreshness}</td>
        <td>{row.publicProof}</td><td><strong>NOT_GIVEN / HELD</strong></td>
      </tr>)}</tbody>
    </table></div>
    <p>Local audit: <strong>{reviewRun?'RUN':'NOT_RUN'}</strong>; fresh GitHub:
      <strong> {checks?'RUN':'NOT_RUN'}</strong>{checkedAt?` (${checkedAt})`:''}.
      {' '}Original owner JSON: <strong>{data.originalSanitizedOwnerPackets}/6</strong>;
      owner isolation reports: <strong>{data.ownerIsolationReports}/6</strong>;
      authenticated custodians / signed proofs / verified isolated tenants: <strong>0</strong>.
      Live pilot gates: <strong>12/12 HELD</strong>.</p>
    <button type="button" onClick={()=>void copyReport()}>Copy nonsecret six-app QL-262 evidence ledger</button>
    <textarea readOnly rows={10} aria-label="QL-262 nonsecret evidence ledger"
      value={JSON.stringify({...data,publicCheckObservedAt:checkedAt||null},null,2)}/>
    <p><strong>Integration DISCONNECTED / HOLD.</strong> No owner TEST-only approval,
      authenticated gateway GET, live call, SMS, dispatch, account mutation,
      Etsy POST or Windows relay installation is authorized. All this session's
      entries are temporary and disappear on refresh.</p>
  </section>;
}
