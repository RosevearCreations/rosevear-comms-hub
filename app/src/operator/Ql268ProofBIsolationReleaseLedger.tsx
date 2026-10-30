import {useState} from 'react';
import {QL268_SOURCE_PROOF_RECHECK,QL268_PROOF_PATH,ql268ReleaseLedger,
  type Ql268OwnerPreparation,type Ql268SourceId}
  from './ql268ProofBIsolationReleaseLedger';

const CHECKS=[
  ['isolatedNonproductionProject','Separate nonproduction project and tenant prepared'],
  ['scopedReadOnlyGetIdentity','Read-only GET identity prepared, no write permissions'],
  ['denyCasePlanReviewed','Seven negative authorization cases reviewed'],
  ['stopRollbackPrepared','Stop and rollback plan drafted'],
  ['productionAndPrivateDataExcluded','Customer, production and home data excluded']
] as const;

export function Ql268ProofBIsolationReleaseLedger(){
  const [prepared,setPrepared]=useState<Ql268OwnerPreparation>({});
  const [previous,setPrevious]=useState('');
  const [report,setReport]=useState<ReturnType<typeof ql268ReleaseLedger>|null>(null);
  const [message,setMessage]=useState('');
  function toggle(source:Ql268SourceId,key:typeof CHECKS[number][0],checked:boolean){
    setPrepared(current=>({...current,[source]:{...current[source],[key]:checked}}));
    setReport(null);
  }
  function review(){
    setReport(ql268ReleaseLedger(prepared,previous));
    setMessage('Read-only local HOLD ledger calculated. No signed proof, identity or gateway test was authorized.');
  }
  async function copy(){
    if(!report)return;
    try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));
      setMessage('Nonsecret QL-268 HOLD ledger copied. No private approval is implied.');
    }catch{setMessage('Copy unavailable; select the report below to copy manually.');}
  }
  return <section className="ql245-panel" aria-labelledby="ql268-title" data-ql268-status="held">
    <h4 id="ql268-title">QL-268 · Original signed proof-B exceptions, isolated nonproduction tenant &amp; GET release ledger (HELD)</h4>
    <p><strong>30 October 2026 exact-source recheck:</strong> <code>{QL268_PROOF_PATH}</code>
      {' '}returned <strong>HTTP 404 in all six repositories</strong> at the source commits listed below.
      A later commit must be checked again. A GREEN software build is not a signer proof.</p>
    <p><strong>Optional prior sanitized return:</strong> paste only the QL-267 nonsecret HOLD ledger.
      Do not paste passwords, signer keys, witness challenges, names, private tenant IDs,
      restricted key locations, home addresses or network details.</p>
    <textarea rows={4} maxLength={48000} aria-label="QL-267 sanitized ledger JSON, optional"
      value={previous} placeholder="No actual QL-267 owner return provided"
      onChange={e=>{setPrevious(e.currentTarget.value);setReport(null);}}/>
    <details><summary>Six source proof publication exceptions and owner preparation checklist</summary>
      {QL268_SOURCE_PROOF_RECHECK.map(source=><fieldset key={source.source}>
        <legend><strong>{source.source}</strong> · original B HTTP 404</legend>
        <p>Exact main SHA: <code>{source.sha}</code></p>
        {CHECKS.map(([key,label])=><label key={key} style={{display:'block',margin:'0.25rem 0'}}>
          <input type="checkbox" checked={prepared[source.source]?.[key]===true}
            onChange={e=>toggle(source.source,key,e.currentTarget.checked)}/>
          {' '}{label} <em>(owner self-report only)</em>
        </label>)}
      </fieldset>)}
    </details>
    <p>All five checkboxes are nonauthorizing progress notes. Real tenant isolation,
      key custody, witness identity and TEST permission require external independent verification.</p>
    <button type="button" onClick={review}>Review six-app release ledger (offline)</button>
    <button type="button" disabled={!report} onClick={()=>void copy()}>Copy sanitized QL-268 ledger</button>
    {message&&<p className="ql245-message" role="status">{message}</p>}
    {report&&<>
      <p role="status"><strong>{report.integration}</strong> · proof B: {report.originalSignedProofBStatus}
        {' '}· nonproduction isolation: {report.independentNonproductionIsolation}
        {' '}· TEST: {report.boundedGetTrial}.</p>
      <p>{report.ownerPreparationCompleteSelfReports}/6 complete owner self-reports,
        {' '}{report.exactMainProof404Count}/6 signed proofs missing,
        {' '}{report.authenticatedGatewayGetCount} authorized gateway GETs.</p>
      <textarea readOnly rows={11} aria-label="QL-268 sanitized proof B and GET trial release HOLD ledger"
        value={JSON.stringify(report,null,2)}/>
    </>}
    <p><strong>Real GET dry run is blocked.</strong> A separate authenticated reviewer must
      confirm original signed A→B proof, true key custody, distinct nonce witness,
      independently pinned SPKI, six isolated nonproduction tenants and scoped read-only
      identities. Obtain separate owner TEST-only authorization plus stop/rollback approval.
      Only then consider two positive and seven denial-only GETs per app within fifteen
      minutes. This screen issues no credentials, opens no sockets, schedules no slot and
      leaves all 12 live-pilot holds unchanged.</p>
  </section>;
}
