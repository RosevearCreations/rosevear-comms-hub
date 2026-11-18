import './ql468-original-host-readiness.css';

const controls=[
 {name:'Windows worker installation',state:'SIGNED PLAN / HOLD',
  detail:'Demand-start virtual account, exact image hash, rollback plan and original-host task inventory. Owner and independent witness must sign the same plan; no installation is performed.'},
 {name:'Isolated TLS 1.3 mutual authentication',state:'LOCAL CRYPTO TEST ONLY',
  detail:'CI proves an ephemeral loopback certificate handshake and signed durable ACK. DESKTOP-AE894KC and private peer certificates are not involved in that test.'},
 {name:'Certificate rollover',state:'CUTOVER HOLD',
  detail:'Separate signed current/candidate certificate and issuer fingerprints; enforced 1–24 hour overlap, validity windows, expiry margin and manual cutover.'},
 {name:'Independently audited first ACK',state:'FIELD EVIDENCE HOLD',
  detail:'Exact message, signed source envelope, durable RECEIVED ACK, independent signed audit, original Windows boot ID and receiver-OFF witness are required. No live ACK accepted here.'}
] as const;
export function Ql468OriginalHostReadiness(){
 return <section className="ql468-host" aria-labelledby="ql468-host-title" data-ql468-state="HOLD">
  <header>
   <p className="ql468-eyebrow">QL-468 · ORIGINAL-HOST WORKER / mTLS PILOT / FIRST ACK</p>
   <h2 id="ql468-host-title">Windows worker readiness &amp; independent pilot evidence</h2>
   <p>Code delivery does not equal Windows service installation, a physical reboot,
    live peer authorization or acceptance of a real first ACK.</p>
   <strong role="status" className="ql468-hold">FIELD ACTIVATION: HOLD · QL-340C RECEIVER: OFF / UNKNOWN</strong>
  </header>
  <div className="ql468-grid" role="list">
   {controls.map(item=><article key={item.name} role="listitem">
    <h3>{item.name}</h3><strong>{item.state}</strong><p>{item.detail}</p>
   </article>)}
  </div>
  <p className="ql468-note">Read-only on the actual host: <code>runtimes/master-telemetry/ql468-original-host-readonly.ps1 -Mode Inspect</code>.
   Run directly by the owner on DESKTOP-AE894KC. This preview cannot connect to the host,
   make changes, start a listener, authorize a reboot or handle private keys.</p>
 </section>;
}
