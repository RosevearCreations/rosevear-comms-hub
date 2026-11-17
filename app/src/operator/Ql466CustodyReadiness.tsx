import './ql466-custody-readiness.css';
const checks=[
 {name:'Separate Comms Windows worker',state:'NOT VERIFIED',
  detail:'Rosevear-CommsHub is a proposed SCM service; no signed installation or post-boot startup evidence.'},
 {name:'Private QL-340C TEST receiver',state:'HOLD / UNKNOWN',
  detail:'Supervised foreground only. Never include ql340c-windows-operator.ps1 -Start in Windows startup tasks.'},
 {name:'Read-only Master event recipient',state:'NOT IMPLEMENTED',
  detail:'No POST /internal/rosevear/master/events/read-only/v1 route exists in the Comms release.'},
 {name:'Peer mTLS / pinned Ed25519 / ACK',state:'UNVERIFIED',
  detail:'No observed independent mTLS handshake, pinned signing issuer, durable recipient ACK or separate owner audit.'},
 {name:'Vault key custody and rotation',state:'SOURCE REVIEW ONLY',
  detail:'Signed inventories and distinct dual-owner rotation plans can be checked locally; no live Vault/KMS keys activated.'}
] as const;
export function Ql466CustodyReadiness(){
 return <section className="ql466-status" aria-labelledby="ql466-status-heading" data-ql466-live="false">
  <header><p className="ql466-caption">QL-466 · SECRETS AND ORIGINAL HOST ASSURANCE</p>
   <h2 id="ql466-status-heading">Worker, key-custody &amp; boot acceptance</h2>
   <p>Source code GREEN does not establish a running Windows worker, a live peer sink or independently witnessed original-host boot.</p>
   <strong className="ql466-hold" role="status">REBOOT AUTHORIZATION: HOLD</strong></header>
  <div className="ql466-items" role="list">
   {checks.map(c=><article role="listitem" key={c.name}>
    <h3>{c.name}</h3><strong>{c.state}</strong><p>{c.detail}</p>
   </article>)}
  </div>
  <p className="ql466-boundary">No automatic service installation, receiver activation, certificate changes,
   database credentials, Tailscale edits or unattended key rotation in QL-466.
   Signer enrollment, live sink implementation, signed host observations and independent ACK are required separately.</p>
 </section>;
}
