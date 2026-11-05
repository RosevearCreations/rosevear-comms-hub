import {useState} from 'react';
import './ql335-shell-readiness.css';

const sources=[
  {id:'rosiedazzlers',name:'Auto-detailing platform',firstChild:'Rosie Dazzlers',
    repository:'rosiedazzlers',schema:'Supabase/Postgres FORCE RLS',
    boundary:'Legacy bookings, customers, staff, payments and photos are not yet child-scoped.'},
  {id:'devilndove',name:'Maker-commerce platform',firstChild:'Devil n Dove',
    repository:'devilndove-site',schema:'Cloudflare D1 per-query isolation (SQLite has no RLS)',
    boundary:'Legacy Etsy, listings, orders, media, inventory and fulfilment are not yet child-scoped.'}
] as const;

/** Read-only owner explanation: no browser-issued signer, private request or enrollment. */
export function Ql336ChildShellReadiness(){
  const [selected,setSelected]=useState<(typeof sources)[number]['id']>('rosiedazzlers');
  const item=sources.find(x=>x.id===selected)!;
  return <section className="ql335" aria-labelledby="ql336-title" data-ql336="source-isolation-pending-no-signed-test">
    <header className="ql335-heading">
      <div><p className="ql271-eyebrow">QL-336 · reusable owned-business shell preparation</p>
        <h3 id="ql336-title">Two future platforms · first businesses preserved</h3>
        <p>New shell GET endpoints are separate from the existing integration API, and return HOLD until the original source signer, isolation review and exact TEST authority are proven. Pending schema designs do not convert legacy business data.</p>
      </div>
      <span className="ql335-status">0 OF 2 AUTHENTICATED · HOLD</span>
    </header>
    <div className="ql335-source-switch" role="group" aria-label="Inspect owned business shell">
      {sources.map(x=><button key={x.id} type="button" aria-pressed={selected===x.id}
        onClick={()=>setSelected(x.id)}>{x.firstChild}<span>Future {x.name}</span></button>)}
    </div>
    <article className="ql335-detail" aria-live="polite">
      <h4>{item.name} · {item.id}</h4>
      <p><strong>First child:</strong> {item.firstChild}. This owned business is not a platform-wide connector identity.</p>
      <dl>
        <div><dt>Pending child registry</dt><dd>{item.schema}</dd></div>
        <div><dt>Signed private source request</dt><dd className="ql335-held">DISCONNECTED / HOLD</dd></div>
        <div><dt>Existing business data</dt><dd>Unchanged · legacy ownership preserved</dd></div>
        <div><dt>New shell GET paths</dt><dd><code>/api/integration/v1/shell/health</code> and <code>/api/integration/v1/shell/capabilities</code></dd></div>
      </dl>
      <p>{item.boundary}</p>
      <div className="ql335-links"><a target="_blank" rel="noreferrer" href={`https://github.com/RosevearCreations/${item.repository}/tree/main/functions/api/integration/v1/shell`}>Inspect source shell endpoints</a>
        <a target="_blank" rel="noreferrer" href={`https://github.com/RosevearCreations/${item.repository}/tree/main/.well-known`}>Inspect original unsigned discovery manifest</a></div>
    </article>
    <section className="ql335-gates" aria-label="QL-336 activation requirements"><h4>Still required before any child enrollment or authenticated test</h4>
      <ol>
        <li><span>HOLD</span> Verified source backups and separately approved tenant-isolation backfill.</li>
        <li><span>HOLD</span> Source-side row/query, media, provider-handle and export denial tests for different children.</li>
        <li><span>HOLD</span> Independent source signer, broker workload, managed KMS and durable nonce claim.</li>
        <li><span>HOLD</span> Original source-owner and master owner TEST decisions with an exact pinned nonproduction origin.</li>
      </ol>
      <p>No live Etsy, payment, bookings, customer portal, SMS or dispatch activation is authorized.</p>
    </section>
  </section>;
}
