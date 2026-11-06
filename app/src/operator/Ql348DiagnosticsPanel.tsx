import {useState,type ChangeEvent} from 'react';
import {QL341_SIX_PEERS} from './ql341PrivateStatus';
import './ql348-diagnostics.css';

type Diagnostic={peerId:string;repository:string;kind:'business'|'support';
  state:'DISCONNECTED / HOLD';reason:'SOURCE_SIDE_SIGNED_TEST_HANDSHAKE_NOT_AUTHORIZED';
  sourceTestAuthorized:false;customerDataAllowed:false};
export type Ql348Readback={schema:'rosevear.hub.ql348.supervised-single-test-diagnostics.v1';
  state:string;inspectedAt:string;peerCount:6;connectedCount:0;
  singleTestReceiptVerified:boolean;singleTestReceiptState:string;
  observedHeldReceiptCount:number;privateDatabaseRoleVerified:true;
  evidenceSource:'PRIVATE_POSTGRES_READ_ONLY_NOT_BROWSER_OR_OPERATOR_ASSERTION';
  supervisedTestExecuted:false;independentIssuerAuthorityVerified:false;
  ownerApprovalGranted:false;receiverActivated:false;databaseWrites:0;
  customerCommunications:false;deviceActions:false;diagnostics:Diagnostic[]};

/** Browser import is presentation only. Nothing loaded grants an enrollment. */
export function parseQl348Readback(value:unknown):Ql348Readback{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID');
  const v=value as Partial<Ql348Readback>;
  if(v.schema!=='rosevear.hub.ql348.supervised-single-test-diagnostics.v1'||
    !['HOLD_ONE_INDEPENDENTLY_VERIFIED_TEST_RECEIPT_REQUIRED',
      'ONE_ORIGINAL_TEST_RECEIPT_VERIFIED_SIX_PEERS_STILL_HOLD'].includes(v.state??'')||
    v.privateDatabaseRoleVerified!==true||
    v.evidenceSource!=='PRIVATE_POSTGRES_READ_ONLY_NOT_BROWSER_OR_OPERATOR_ASSERTION'||
    v.supervisedTestExecuted!==false||v.independentIssuerAuthorityVerified!==false||
    v.ownerApprovalGranted!==false||v.receiverActivated!==false||
    v.databaseWrites!==0||v.connectedCount!==0||v.peerCount!==6||
    v.customerCommunications!==false||v.deviceActions!==false||
    typeof v.singleTestReceiptVerified!=='boolean'||
    v.singleTestReceiptVerified!==
      (v.state==='ONE_ORIGINAL_TEST_RECEIPT_VERIFIED_SIX_PEERS_STILL_HOLD')||
    typeof v.singleTestReceiptState!=='string'||
    !Number.isSafeInteger(v.observedHeldReceiptCount)||(v.observedHeldReceiptCount??-1)<0||
    (v.singleTestReceiptVerified&&v.observedHeldReceiptCount!==1)||
    !Number.isFinite(Date.parse(v.inspectedAt??''))||
    Date.parse(v.inspectedAt??'')>Date.now()+60_000||
    !Array.isArray(v.diagnostics)||v.diagnostics.length!==6)throw Error('INVALID');
  const seen=new Set<string>();
  for(const item of v.diagnostics){
    const expected=QL341_SIX_PEERS.find(p=>p.id===item?.peerId);
    if(!expected||seen.has(item.peerId)||item.repository!==expected.repository||
      item.kind!==(expected.kind==='Business app'?'business':'support')||
      item.state!=='DISCONNECTED / HOLD'||
      item.reason!=='SOURCE_SIDE_SIGNED_TEST_HANDSHAKE_NOT_AUTHORIZED'||
      item.sourceTestAuthorized!==false||item.customerDataAllowed!==false)
      throw Error('INVALID');
    seen.add(item.peerId);
  }
  return v as Ql348Readback;
}

export function Ql348DiagnosticsPanel(){
  const [readback,setReadback]=useState<Ql348Readback|null>(null);
  const [error,setError]=useState('');
  async function importReadback(e:ChangeEvent<HTMLInputElement>){
    const file=e.currentTarget.files?.[0];setReadback(null);setError('');
    if(!file)return;
    if(file.size>32_768){setError('Readback too large for nonsecret diagnostics.');return;}
    try{setReadback(parseQl348Readback(JSON.parse(await file.text())));}
    catch{setError('Rejected: unsupported or elevated TEST connection claims.');}
    e.currentTarget.value='';
  }
  const stale=readback&&Date.now()-Date.parse(readback.inspectedAt)>86_400_000;
  return <section className="ql348" data-ql348="supervised-readonly" aria-labelledby="ql348-title">
    <header><div><small>QL-348 · I.T. / Connections · supervised TEST</small>
      <h5 id="ql348-title">One original receipt. Six honest connection states.</h5>
      <p>Read-only diagnostics from Ree's private database role. The first authentic device receipt does not connect or authorize any source application.</p>
    </div><strong>6 / 6 HOLD</strong></header>
    <div className="ql348-guide">
      <div><h6>01 · Original owner preflight</h6><code>node .\runtimes\hub-relay\ql348-supervised-test-diagnostics.mjs --help</code>
        <p>Ree and Jack independently complete the original issuer, witnessed field and exact TEST owner approvals before an operator may enroll anything.</p></div>
      <div><h6>02 · Independent receipt verification</h6>
        <p>After a separately authorized one-time TEST on Ree's original Windows machine, the private readback checks the database role, original device signature, exactly one matching receipt and all six shell records.</p>
        <label htmlFor="ql348-file">Import nonsecret QL-348 diagnostics (.json)</label>
        <input id="ql348-file" type="file" accept=".json,application/json" onChange={importReadback}/>
        <p role="status">{error||(readback?
          `${stale?'STALE · refresh on original host':'Owner review required'} · one TEST receipt: ${readback.singleTestReceiptVerified?'verified':'not verified'}`:
          'No private QL-348 readback imported · receipt not observed here')}</p></div>
    </div>
    <div className="ql348-peers" aria-label="Six application TEST diagnostic statuses">
      {QL341_SIX_PEERS.map(peer=><article key={peer.id}><strong>{peer.label}</strong>
        <span>DISCONNECTED / HOLD</span><small>Source handshake not authorized · {peer.repository}</small></article>)}
    </div>
    <footer>NO BROWSER NETWORK · NO SIGNING · NO ENROLLMENT · NO CUSTOMER CALLS/SMS · NO DEVICE ACTIONS. A local JSON import is not proof of the original witness.</footer>
  </section>;
}
