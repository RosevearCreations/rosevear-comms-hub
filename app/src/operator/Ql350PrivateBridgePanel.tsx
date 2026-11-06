import {useState} from 'react';
import {QL349_PUBLIC_SOURCES} from './ql349PublicSourceRefresh';
import {checkPrivateQl350Bridge,requestOnePrivateQl350Test,
  type Ql350PrivateStatus,type Ql350TestResult} from './ql350PrivateBridgeClient';
import './ql350-private-control.css';

/** Same-origin private Caddy/Tailnet deployment can authenticate through its
 * server-managed session. Static Pages gets a 404/HOLD, never a private key. */
export function Ql350PrivateBridgePanel(){
  const [status,setStatus]=useState<Ql350PrivateStatus|null>(null);
  const [checking,setChecking]=useState(false);
  const [active,setActive]=useState<string|null>(null);
  const [message,setMessage]=useState('Private control bridge not checked in this session.');
  const [results,setResults]=useState<Record<string,Ql350TestResult>>({});
  async function check(){
    if(checking||active)return;
    setChecking(true);setStatus(null);setResults({});
    try{
      const report=await checkPrivateQl350Bridge();
      if(report){setStatus(report);setMessage(report.readyForOneSourceTest?
        'Original signed TEST receipt verified by the private broker. Each source still requires separate authority.':
        'Original Windows enrollment or signed TEST receipt is missing. Six apps remain HOLD.');}
      else setMessage('No authenticated private bridge on this origin. Public Pages stays read-only.');
    }catch{setMessage('Private bridge unavailable, blocked or timed out. No connection was attempted.');}
    finally{setChecking(false);}
  }
  async function runOne(sourceId:string){
    if(!status?.readyForOneSourceTest||checking||active)return;
    setActive(sourceId);setMessage(`Reviewing independent ${sourceId} TEST authority…`);
    try{
      const result=await requestOnePrivateQl350Test(sourceId,crypto.randomUUID());
      if(result){setResults(old=>({...old,[sourceId]:result}));
        setMessage(`Private broker: ${result.state}. Persistent connection remains HOLD.`);}
      else setMessage('Private TEST denied, unavailable or unverified; no connection established.');
    }catch{setMessage('Private TEST failed safely. Independent recovery review is required; no automatic retry.');}
    finally{setActive(null);}
  }
  return <section className="ql350-private" aria-labelledby="ql350-title">
    <header><div><small>QL-350 · Authenticated private connection bridge</small>
      <h4 id="ql350-title">One secure control window. Six independent TEST approvals.</h4>
      <p>The Hub reuses original Windows/Jack signing authority through a private server.
        No keys, passwords or tenant secrets are entered into this browser.</p></div>
      <span>0/6 LIVE · HOLD</span></header>
    <div className="ql350-actions"><button type="button" disabled={checking||Boolean(active)}
      onClick={check}>{checking?'Checking private bridge…':'Check private bridge'}</button>
      <p role="status">{message}</p></div>
    <div className="ql350-steps" aria-label="Guided private activation prerequisites">
      <article><strong>1 · Private operator session</strong><span>{status?'Authenticated private readback':'Not independently observed here'}</span></article>
      <article><strong>2 · Original Windows enrollment</strong><span>{status?.originalEnrollmentCount===1?'One enrolled original device':'Independent owner enrollment HOLD'}</span></article>
      <article><strong>3 · Original signed TEST receipt</strong><span>{status?.originalReceiptVerified?'Authentic private witness observed':'Signed device receipt HOLD'}</span></article>
      <article><strong>4 · Individual source TESTs</strong><span>Separate source-owner signature and append-only witness required</span></article>
    </div>
    <details className="ql351-windows-guide">
      <summary>QL-351 · Install the original Windows adapter — owner walkthrough</summary>
      <ol>
        <li><strong>Here in Comms Hub · I.T. / Connections:</strong> check the private bridge. A public disabled-preview HOLD is expected until the original private service is installed and authenticated.</li>
        <li><strong>On Ree’s original Windows server · PowerShell:</strong> open the <code>rosevear-comms-hub</code> repository at clean, updated <code>main</code>; run <code>.\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -Status</code>, then <code>-Install</code>. The owner must confirm staging.</li>
        <li><strong>On Ree’s Windows server · PowerShell:</strong> run the same adapter with <code>-Preflight</code> and <code>-Readback</code>. Existing DPAPI secrets remain on the machine; a staged adapter alone does not grant TEST authority.</li>
        <li><strong>On Jack’s separate laptop:</strong> review and independently sign the exact TEST request using the existing QL-340B ceremony. Keep his private key on his laptop.</li>
        <li><strong>With both original approvals:</strong> complete the separate database enrollment with an independently authorized operator. Only then, on Ree’s server, use <code>-SupervisedReceiver</code>; stop and independently verify exactly one signed receipt.</li>
        <li><strong>Back here:</strong> check the authenticated private bridge again; proceed to each application only when its own source authority and witness are independently confirmed.</li>
      </ol>
      <p>Installation does not turn on Tailscale Serve, send a handshake, copy signing keys, connect customers or change the other five repositories. The full field procedures are in <code>docs/build-records/QL-351_WINDOWS_ADAPTER_FIRST_TEST_OWNER_RUNBOOK.md</code> in the repository.</p>
    </details>
    <div className="ql350-peer-grid" aria-label="Six supervised source TEST actions">
      {QL349_PUBLIC_SOURCES.map(source=><article key={source.id}>
        <div><strong>{source.label}</strong><span>DISCONNECTED / HOLD</span></div>
        <small>{results[source.id]?.state??'No independently verified source TEST receipt'}</small>
        <button type="button" disabled={!status?.readyForOneSourceTest||Boolean(active)||checking}
          onClick={()=>runOne(source.id)}>{active===source.id?'Reviewing signed TEST…':'Run one authorized TEST'}</button>
      </article>)}
    </div>
    <p className="ql350-note">This screen sends requests only to its own origin. On the public disabled preview,
      the private bridge is absent and TEST actions are disabled. The Windows/Tailnet host must
      provide an authenticated same-origin bridge and independently verified original enrollment,
      source signer, owner decision and durable receipt. Even one valid TEST does not enable customer data,
      messaging or production connections.</p>
  </section>;
}
