import {useState} from 'react';
import {QL267_PROOF_RECHECK,QL267_SOURCE_MAIN_RECHECK,ql267ReconcileReturns}
  from './ql267SixAppReceiptReconciliation';

export function Ql267SixAppReceiptReconciliation(){
  const [walkthrough,setWalkthrough]=useState('');
  const [witness,setWitness]=useState('');
  const [report,setReport]=useState<ReturnType<typeof ql267ReconcileReturns>|null>(null);
  const [message,setMessage]=useState('');

  function changed(setter:(value:string)=>void,value:string){
    setter(value);setReport(null);setMessage('Input changed; run the offline review again.');
  }
  function review(){
    setReport(ql267ReconcileReturns(walkthrough,witness));
    setMessage('Local-only receipt review complete. No private identity or TEST has been approved.');
  }
  async function copy(){
    if(!report)return;
    try{
      await navigator.clipboard.writeText(JSON.stringify(report,null,2));
      setMessage('Sanitized QL-267 HOLD ledger copied. This is not a security authorization.');
    }catch{setMessage('Clipboard unavailable; select the JSON report below to copy it.');}
  }

  return <section className="ql245-panel" data-ql267-status="held" aria-labelledby="ql267-title">
    <h4 id="ql267-title">QL-267 · Six-app owner receipt review, private witness status &amp; nonproduction dry-run gate (HELD)</h4>
    <p>Read-only GitHub proof recheck on <strong>{QL267_PROOF_RECHECK.observedOn}</strong>:
      {' '}<code>{QL267_PROOF_RECHECK.path}</code> returned <strong>HTTP 404 at all six exact main SHAs</strong>.
      These are immutable observations; a later commit requires a new check.</p>
    <details><summary>Show the six observed source commits</summary>
      <ul>{QL267_SOURCE_MAIN_RECHECK.map(source=><li key={source.source}>
        <strong>{source.source}</strong> · <code>{source.sha}</code>
      </li>)}</ul>
    </details>
    <p><strong>Step 1 · Optional owner walkthrough:</strong> Paste only the sanitized JSON
      exported by QL-266 in this hub. An owner saying a screen was viewed is not
      independently witnessed security evidence. Leave blank if no real packet was received.</p>
    <textarea rows={5} maxLength={48000} value={walkthrough}
      aria-label="QL-266 sanitized six-app owner walkthrough JSON (optional)"
      onChange={event=>changed(setWalkthrough,event.currentTarget.value)}
      placeholder="No QL-266 owner walkthrough JSON received" />
    <p><strong>Step 2 · Optional private witness status:</strong> Only paste the
      <em> nonsecret enum-only</em> output of the offline QL-266 Ed25519 verifier.
      Never paste the original challenge, public key, signature, identity, secret,
      credential, store path or network address into this browser.</p>
    <textarea rows={4} maxLength={4000} value={witness}
      aria-label="QL-266 sanitized cryptographic witness status JSON (optional)"
      onChange={event=>changed(setWitness,event.currentTarget.value)}
      placeholder="No independently reviewed private witness outcome received" />
    <p>Both inputs stay in memory on this page. The review checks exact schema and
      permitted fields; rejected inputs are never repeated in the output.</p>
    <button type="button" onClick={review}>Reconcile receipts (offline only)</button>
    <button type="button" disabled={!report} onClick={()=>void copy()}>Copy sanitized QL-267 HOLD ledger</button>
    {message&&<p className="ql245-message" role="status">{message}</p>}
    {report&&<>
      <p role="status"><strong>{report.integration}</strong> · owner packet:
        {' '}{report.ownerPacketIntake} · witness status:
        {' '}{report.privateWitnessStatusIntake} · original signed proof:
        {' '}{report.proofBPublication} · TEST: {report.conditionalDryRun}.</p>
      <p>{report.ownerWalkthroughCount}/6 owner walkthroughs reported;
        {' '}{report.originalSignedProof404Count}/6 immutable public proofs unavailable;
        {' '}{report.authenticatedGatewayGets} authenticated gateway GETs.</p>
      <textarea readOnly rows={11} value={JSON.stringify(report,null,2)}
        aria-label="QL-267 nonsecret reconciled six-app HOLD ledger"/>
    </>}
    <p><strong>No dry run is authorized or scheduled.</strong> A genuine independent
      reviewer must authenticate a real signer custodian, distinct nonce witness,
      public SPKI pin and separate nonproduction tenants; accept original signed proof B;
      then obtain the owner's separate TEST-only and rollback approval.
      Only then may an operator consider a maximum of two positive and seven denial
      GETs per app within 15 minutes. No calls, SMS, dispatch, private relay, or
      real gateway GET is performed by this panel. All 12 live-pilot holds remain.</p>
  </section>;
}
