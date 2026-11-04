import {useState} from 'react';
import './ql335-shell-readiness.css';

const sources=[
  {id:'yw',app:'yard-workers',title:'Yard Workers platform shell',name:'Yard Workers',
    child:'Individual landscaping companies remain separate tenants.',repository:'yw',codeRoot:'api',manifestRoot:'public'},
  {id:'icamp',app:'icamp',title:'iCamp platform shell',name:'iCamp',
    child:'Individual campgrounds remain separate tenants.',repository:'iCamp',codeRoot:'app/api',manifestRoot:'public'}
] as const;
const blockers=[
  'Independently pinned original source signer / Proof-B',
  'Approved broker workload and managed source key handle',
  'Original source-owner and master owner TEST decisions',
  'Verified nonproduction HTTPS origin, signed receipt and durable nonce store'
];

/** Source-verified development status; this public page NEVER initiates a private trial. */
export function Ql335ShellReadiness(){
  const [source,setSource]=useState<'yw'|'icamp'>('yw');
  const chosen=sources.find(item=>item.id===source)!;
  return <section className="ql335" aria-labelledby="ql335-title" data-ql335="signed-code-ready-original-trust-held">
    <header className="ql335-heading">
      <div><p className="ql271-eyebrow">QL-335 · signed nonproduction shell handshakes</p>
        <h3 id="ql335-title">Two SaaS platforms · independent connection gates</h3>
        <p>Read-only signed GET code is installed in both source repositories. It requires real broker and source-managed signatures, atomic replay protection and original approvals. Local cryptographic fixtures are tests, <strong>not</strong> connection evidence.</p>
      </div>
      <span className="ql335-status">0 OF 2 AUTHENTICATED · HOLD</span>
    </header>
    <div className="ql335-source-switch" role="group" aria-label="Inspect platform shell">
      {sources.map(s=><button key={s.id} type="button" aria-pressed={source===s.id}
        onClick={()=>setSource(s.id)}>{s.name}<span>{s.id} / {s.app}</span></button>)}
    </div>
    <article className="ql335-detail" aria-live="polite">
      <h4>{chosen.title}</h4>
      <p>{chosen.child} A signed shell health check cannot authorize customer, job, booking or campground records.</p>
      <dl><div><dt>Master registry identity</dt><dd><code>{chosen.id}</code></dd></div>
        <div><dt>Source application / issuer</dt><dd><code>{chosen.app}</code></dd></div>
        <div><dt>Signed GET health</dt><dd><code>/api/integration/v1/shell/health</code></dd></div>
        <div><dt>Signed GET capabilities</dt><dd><code>/api/integration/v1/shell/capabilities</code></dd></div>
        <div><dt>Private authorization</dt><dd className="ql335-held">DISCONNECTED / HOLD</dd></div></dl>
      <div className="ql335-links">
        <a href={`https://github.com/RosevearCreations/${chosen.repository}/tree/main/${chosen.codeRoot}/integration/v1/shell`} target="_blank" rel="noopener noreferrer">Review source endpoint code</a>
        <a href={`https://github.com/RosevearCreations/${chosen.repository}/blob/main/${chosen.manifestRoot}/.well-known/rosevear-integration-manifest.json`} target="_blank" rel="noopener noreferrer">Inspect public manifest</a>
      </div>
    </article>
    <section className="ql335-gates" aria-label="Original authority blockers">
      <h4>What must be independently verified before either source can be connected?</h4>
      <ol>{blockers.map(reason=><li key={reason}><span aria-hidden="true">◇</span>{reason}</li>)}</ol>
      <p>All four gates are currently unverified for both shells. No key was generated, no TEST authorization was recorded, and no live private request was sent. Existing tenant-scoped v1 APIs are unchanged.</p>
    </section>
  </section>;
}
