import {useState} from 'react';
import {QL266_PUBLIC_RECHECK,QL266_SOURCE_SNAPSHOT,
  ql266BuildAcceptanceReview,type Ql266OwnerUiReview,type Ql266SourceId}
  from './ql266SixAppProductionAcceptance';
import {QL265_SOURCE_APPS} from './ql265LocalSixAppPreflight';

export function Ql266SixAppProductionAcceptance(){
  const [uiReview,setUiReview]=useState<Ql266OwnerUiReview>({});
  const [receipt,setReceipt]=useState<ReturnType<typeof ql266BuildAcceptanceReview>|null>(null);
  const [message,setMessage]=useState('');
  const checkedCount=QL266_SOURCE_SNAPSHOT.filter(app=>uiReview[app.source]===true).length;
  function toggle(source:Ql266SourceId,checked:boolean){
    setUiReview(current=>({...current,[source]:checked}));
    setReceipt(null);
    setMessage('The checklist changed. Run the offline review again to refresh the report.');
  }
  async function copy(){
    if(!receipt)return;
    try{await navigator.clipboard.writeText(JSON.stringify(receipt,null,2));
      setMessage('Nonsecret QL-266 owner-review receipt copied; private approval and TEST remain NOT VERIFIED.');
    }catch{setMessage('Clipboard unavailable. The read-only JSON below can be selected and copied.');}
  }
  return <section className="ql245-panel" aria-labelledby="ql266-title" data-ql266-status="held">
    <h4 id="ql266-title">QL-266 · Six-source production UI acceptance, private witness check &amp; conditional TEST authorization (HELD)</h4>
    <p><strong>Public source proof rechecked {QL266_PUBLIC_RECHECK.date}:</strong>
      {' '}<code>{QL266_PUBLIC_RECHECK.path}</code> returned <strong>HTTP 404 for six of six</strong>
      {' '}immutable QL-265 main commits. This does not prove a later commit's status.
      A successful software promotion never substitutes for original signed proof B.</p>
    <fieldset><legend>Owner-facing interface walkthrough · local checklist, not identity verification</legend>
      {QL266_SOURCE_SNAPSHOT.map(row=>{
        const app=QL265_SOURCE_APPS.find(item=>item.id===row.source);
        return <label key={row.source} style={{display:'block',margin:'0.35rem 0'}}>
          <input type="checkbox" checked={uiReview[row.source]===true}
            onChange={event=>toggle(row.source,event.currentTarget.checked)}/>
          {' '}I opened <strong>{row.source}</strong> in its I.T. / Connections interface
          {' '}(<code>{app?.ui}</code>) and inspected the local-only test.
        </label>;
      })}
    </fieldset>
    <p role="status">{checkedCount}/6 interface walkthroughs self-reported. These checkboxes
      do not independently authenticate a person, receipt, key, tenant or approval.</p>
    <button type="button" onClick={()=>{
      setReceipt(ql266BuildAcceptanceReview(uiReview));setMessage('Offline acceptance summary calculated. Network TEST remains HELD.');
    }}>Review six-app acceptance &amp; TEST gate (offline)</button>
    <button type="button" disabled={!receipt} onClick={()=>void copy()}>Copy sanitized QL-266 review</button>
    {message&&<p className="ql245-message" role="status">{message}</p>}
    {receipt&&<><p><strong>{receipt.integration}</strong> · public signed proof B:
      {' '}{receipt.originalSignedProofBStatus} · private custodian/witness/reviewer:
      {' '}{receipt.signerCustodianWitnessReviewerStatus} · owner TEST: {receipt.ownerTestAuthorization}.
      <strong> No authorized gateway GETs.</strong></p>
      <textarea readOnly rows={10} aria-label="QL-266 sanitized owner-review and conditional TEST gate receipt"
        value={JSON.stringify(receipt,null,2)}/></>}
    <p><strong>Actual independent witness evidence is not received.</strong>
      A separate authenticated custodian, distinct nonce witness and reviewer must
      examine genuine restricted signer-key possession and validate the real SPKI
      out of band. Keep challenge material, keys, secret paths, private identities,
      tenant credentials and home-network data outside this browser and GitHub.</p>
    <p><strong>Conditional read-only TEST slot: HELD / unscheduled.</strong> Only after
      real signed A→B proof, independently validated private role decisions,
      isolated nonproduction tenants, separately authenticated owner TEST-only
      authorization and rollback approval may an operator consider two positive
      and seven denial-only GETs per app within fifteen minutes. This screen
      issues no credentials, proof, signature, socket, private relay or real GET;
      all twelve live-pilot holds remain unchanged.</p>
  </section>;
}
