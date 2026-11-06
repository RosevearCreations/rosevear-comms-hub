import {useState,type ChangeEvent} from 'react';
import {QL341_SIX_PEERS,ql341ParsePrivateReadback,type Ql341Snapshot} from './ql341PrivateStatus';
import './ql341-private-connections.css';

export function Ql341PrivateConnectionDashboard(){
  const [snapshot,setSnapshot]=useState<Ql341Snapshot|null>(null);
  const [error,setError]=useState('');
  const [help,setHelp]=useState(false);
  const witness=snapshot?.witness;
  const stale=snapshot?Date.now()-Date.parse(snapshot.exportedAt)>86_400_000:false;
  async function onFile(event:ChangeEvent<HTMLInputElement>){
    const file=event.currentTarget.files?.[0];
    setSnapshot(null);setError('');
    if(!file)return;
    if(file.size>32_768){setError('Readback exceeds the 32 KB nonsecret limit.');return;}
    try{setSnapshot(ql341ParsePrivateReadback(JSON.parse(await file.text())));}
    catch{setError('Rejected: this file is not a scoped, held QL-341 private readback.');}
    event.currentTarget.value='';
  }
  return <section className="ql341" aria-labelledby="ql341-heading" data-ql341-transport="owner-import-only">
    <header className="ql341-head"><div><span className="ql341-eyebrow">QL-341 · I.T. / Connections · private evidence</span>
      <h4 id="ql341-heading">Six-app connection dashboard</h4>
      <p>Real private PostgreSQL TEST readbacks can be reviewed here after the Windows owner exports them. The dashboard never contacts the Windows Hub, Supabase, or a source application.</p></div>
      <span className="ql341-hold" role="status">0 / 6 CONNECTED · HOLD</span></header>
    <div className="ql341-metrics" aria-label="Private TEST connection metrics">
      <article><small>Registered private peers</small><strong>6 / 6</strong><span>Four businesses · two supporting systems</span></article>
      <article><small>Authenticated live connections</small><strong>0 / 6</strong><span>Not enabled by a TEST receipt</span></article>
      <article><small>Signed TEST hub witness</small><strong>{witness?.verified?'1 / 1':'0 / 1'}</strong><span>{witness?.verified?'Receipt matched; still held':'Original owner signatures and receipt pending'}</span></article>
      <article><small>Held DB receipts</small><strong>{snapshot?snapshot.heldDeviceReceiptCount:'—'}</strong><span>{snapshot?'Private readback · TEST only':'No private readback imported'}</span></article>
    </div>
    <div className="ql341-review"><div><h5>Read-only owner evidence</h5>
      <p>Import the nonsecret <code>ql341-private-readback-*.json</code> exported on Ree's Windows server. No key, password, database URL or customer record belongs in this file.</p>
      <label htmlFor="ql341-file">Load a private status readback (.json)</label>
      <input id="ql341-file" type="file" accept="application/json,.json" onChange={onFile}/>
      <button type="button" className="ql341-help" onClick={()=>setHelp(!help)} aria-expanded={help} aria-controls="ql341-help">ⓘ How this verification works</button>
      {help&&<p id="ql341-help" className="ql341-helptext">The private Node verifier independently checks both owner-signed enrollment keys, the original device signature, and the exact append-only database receipt. Loading its export here is display-only and is not independent proof that the export itself was delivered by the owner. Always corroborate on Ree's server.</p>}</div>
      <div className="ql341-readback" aria-live="polite" role="status">
        {error?<strong className="ql341-bad">{error}</strong>:snapshot?<><strong>Operator-imported private readback</strong>
          <span>Exported: {new Date(snapshot.exportedAt).toLocaleString('en-CA')}</span>
          <span>{stale?'STALE · owner must re-export':'DATED · owner confirmation still required'}</span>
          <span>Signed receipt: {witness?.verified?'VERIFIED TEST ONLY':'NOT VERIFIED'}</span></>:<><strong>NO PRIVATE READBACK LOADED</strong><span>Six peer labels are present, but no authenticated field exchange has been observed here.</span></>}
      </div></div>
    <div className="ql341-peers" aria-label="Six application connection states">
      {QL341_SIX_PEERS.map(peer=><article key={peer.id} className="ql341-peer"><div><span className="ql341-icon">{peer.icon}</span><span><strong>{peer.label}</strong><small>{peer.kind}</small></span></div>
        <span className="ql341-state">DISCONNECTED / HOLD</span>
        <p>{peer.id==='rosevear-ai-hub'&&witness?.verified?'One original signed device TEST heartbeat matched a held DB receipt. This is not peer activation.':'Original independent signed peer handshake not yet witnessed.'}</p>
        <small>Private peer: {peer.repository} · no customer data access</small></article>)}
    </div>
    <footer>Read-only preview · 0 outbound requests · 0 source writes · no calls, SMS or home device actions. A production GREEN build does not establish any of these six private connections.</footer>
  </section>;
}
