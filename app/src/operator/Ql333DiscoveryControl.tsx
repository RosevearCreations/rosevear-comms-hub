import {useState} from 'react';
import {QL331_PUBLIC_SOURCES} from './ql331MasterAccess';
import './ql332-custody-control.css';

const paths:Record<string,string>={
  yw:'public',icamp:'public',rosiedazzlers:'',devilndove:'',
  'ai-data-platform':'apps/web/public','rosevear-ai-hub':'apps/web/public'
};
const repos:Record<string,string>={
  yw:'yw',icamp:'iCamp',rosiedazzlers:'rosiedazzlers',devilndove:'devilndove-site',
  'ai-data-platform':'ai-data-platform','rosevear-ai-hub':'rosevear-ai-hub'
};

/** Public contract catalogue only. Private verification runs in the Node coordinator. */
export function Ql333DiscoveryControl(){
  const [filter,setFilter]=useState<'all'|'shell'|'support'>('all');
  const visible=QL331_PUBLIC_SOURCES.filter(s=>filter==='all'||
    (filter==='shell'?s.kind==='business':s.kind==='support'));
  return <section className="ql332" data-ql333-state="public-contracts-held" aria-labelledby="ql333-heading">
    <header className="ql332-head"><div>
      <p className="ql271-eyebrow">QL-333 · Six-source contract discovery and identity compatibility</p>
      <h3 id="ql333-heading">Cross-application contract catalogue</h3>
      <p>Six source-owned nonsecret manifests are versioned and reviewed against the master registry. A public descriptor or matching SHA-256 is not a signed peer, tenant access, or permission to send.</p>
    </div><span className="ql332-alert">0 / 6 AUTHENTICATED · HOLD</span></header>
    <div className="ql332-panel">
      <h4>Scope and compatibility</h4>
      <label htmlFor="ql333-filter">Application type</label>{' '}
      <select id="ql333-filter" value={filter} onChange={e=>setFilter(e.currentTarget.value as typeof filter)}>
        <option value="all">All six sources</option><option value="shell">Four business shells</option><option value="support">Two supporting services</option>
      </select>
      <div className="ql332-tiles" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
        {visible.map(s=><article key={s.id}><small>{s.kind==='business'?'Business shell':'Supporting service'}</small>
          <strong>{s.name}</strong><span>Master ID: <code>{s.id}</code></span>
          <span>Source issuer: <code>{s.sourceAppId}</code></span>
          <span>State: unsigned discovery / signed trust HOLD</span>
          <a href={`https://github.com/RosevearCreations/${repos[s.id]}/blob/main/${paths[s.id]?paths[s.id]+'/':''}.well-known/rosevear-integration-manifest.json`}
            target="_blank" rel="noopener noreferrer">Inspect source-owned manifest</a>
        </article>)}
      </div>
    </div>
    <footer>Only immutable public GitHub GET discovery is eligible for automatic checks. Unknown issuer, altered origin, wrong tenant, schema major change, signature mismatch, redirected URL and failed source response are denied. Future signed source tests require source-owned trust and exact owner authorization. Windows relay remains OFF.</footer>
  </section>;
}
