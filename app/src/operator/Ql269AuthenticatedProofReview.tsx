import {useState} from 'react';
import {QL269_SOURCE_PROOF_RECHECK,QL269_PROOF_PATH,ql269BlankSanitizedPacket,
  ql269GetTrialDecision,type Ql269SourceId}
  from './ql269AuthenticatedProofReview';

const CHECKS=[
  ['nonproductionOnly','Separate TEST project / tenant planned'],
  ['productionDataExcluded','Production customer and business data excluded'],
  ['privateOrHomeDataExcluded','Home, camera, vault and other private data excluded'],
  ['separateReadOnlyGetIdentity','App-specific GET-only identity planned'],
  ['sevenDenialsPlanned','All seven denial cases covered'],
  ['stopRollbackReviewed','Stop and rollback reviewed']
] as const;
type CheckName=typeof CHECKS[number][0];

export function Ql269AuthenticatedProofReview(){
  const [draft,setDraft]=useState(ql269BlankSanitizedPacket);
  const [external,setExternal]=useState('');
  const [report,setReport]=useState<ReturnType<typeof ql269GetTrialDecision>|null>(null);
  const [message,setMessage]=useState('');
  function toggle(source:Ql269SourceId,key:CheckName,checked:boolean){
    setDraft(prev=>({...prev,rows:prev.rows.map(row=>row.source===source?
      {...row,[key]:checked}:row)}));
    setReport(null);
  }
  function review(){
    // When supplied, only the strict, nonsecret review packet is consumed; the
    // owner checklist otherwise becomes an untrusted local preparation packet.
    const raw=external.trim()||JSON.stringify(draft);
    setReport(ql269GetTrialDecision(raw));
    setMessage('Offline review completed. No original proof, identity, tenant or TEST authorization was created.');
  }
  async function copy(){
    if(!report)return;
    try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));
      setMessage('Sanitized QL-269 HOLD ledger copied; it is not an authorization.');
    }catch{setMessage('Clipboard unavailable; select the report text to copy manually.');}
  }
  return <section className="ql245-panel" data-ql269-status="held" aria-labelledby="ql269-title">
    <h4 id="ql269-title">QL-269 · Original Proof-B return acceptance, tenant isolation and conditional GET decision (HELD)</h4>
    <p><strong>30 October 2026 immutable source recheck:</strong> the original signed
      {' '}<code>{QL269_PROOF_PATH}</code> returned <strong>404 in all six applications</strong>.
      Software production GREEN is separate from authenticating integration security.
      A newer source commit must be independently checked again.</p>
    <details><summary>Six source commits and nonproduction preparation (owner reports only)</summary>
      {QL269_SOURCE_PROOF_RECHECK.map(source=><fieldset key={source.source}>
        <legend><strong>{source.source}</strong> · signed original B absent</legend>
        <p>Immutable main SHA: <code>{source.sha}</code></p>
        {CHECKS.map(([key,label])=><label key={key} style={{display:'block',margin:'0.3rem 0'}}>
          <input type="checkbox" checked={draft.rows.find(r=>r.source===source.source)?.[key]===true}
            onChange={e=>toggle(source.source,key,e.currentTarget.checked)}/>
          {' '}{label} <em>(unverified preparation)</em>
        </label>)}
      </fieldset>)}
    </details>
    <p><strong>Optional independent return intake:</strong> paste only a separately prepared
      nonsecret QL-269 JSON packet using the documented schema. Public SHA-256 digests and
      checked commit IDs are allowed, but these are <em>claims</em> until independently
      authenticated. A pasted packet overrides the checkboxes for the offline review.
      Never paste keys, signatures, nonce/challenge values, tenant IDs, customer details,
      network addresses, staff identities or approvals here.</p>
    <textarea aria-label="QL-269 sanitized nonsecret source and tenant evidence JSON (optional)"
      rows={4} maxLength={12000} value={external}
      placeholder="Leave blank to review our unverified preparation checklist"
      onChange={e=>{setExternal(e.currentTarget.value);setReport(null);}}/>
    <button type="button" onClick={review}>Review original-proof and GET release gate (offline)</button>
    <button type="button" disabled={!report} onClick={()=>void copy()}>Copy QL-269 HOLD ledger</button>
    {message&&<p className="ql245-message" role="status">{message}</p>}
    {report&&<>
      <p role="status"><strong>{report.integration}</strong> · {report.releaseDecision}
        {' '}· sanitized intake: {report.sanitizedPacketIntake}.</p>
      <p>{report.originalProofB404Count}/6 original proofs unavailable;
        {' '}{report.reportedTenantScopeCompleteCount}/6 complete preparation claims;
        {' '}{report.tenantFingerprintCollisionCount} reported tenant-fingerprint collisions;
        {' '}{report.authenticatedGatewayGets} authenticated GETs.</p>
      <textarea aria-label="QL-269 sanitized original proof-B tenant and conditional GET release ledger"
        readOnly rows={11} value={JSON.stringify(report,null,2)}/>
    </>}
    <p><strong>Release stays DENIED.</strong> Original source-signed A→B proof, independently
      pinned Ed25519 key, authenticated custodian, distinct witness and separate reviewer,
      isolated TEST tenants, scoped GET identity, seven-denial evidence, stop/rollback and
      separately authenticated owner TEST-only approval are required before anyone schedules
      a read-only GET trial. This panel performs no network requests, issues no credentials,
      saves no private data, and leaves all 12 live-pilot holds intact.</p>
  </section>;
}
