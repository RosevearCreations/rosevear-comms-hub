import {useEffect,useRef,useState} from 'react';
import {QL375_HELP_LINKS,QL375_SHELLS,ownerShellStatus} from './ql375OwnerStatus';
import {MASTER_SHELL_REGISTRY,reconcileSourceIdentities} from './ql386MasterShellRegistry';
import {ownerEntryTruth} from './ql374OwnerEntry';
import './ql375OwnerStatus.css';

type Props={truth:ReturnType<typeof ownerEntryTruth>};

/** No source API calls or tenant links: all six rows use the same honest
 * aggregate protected owner readback and an immutable public identity map. */
export function OwnerSixAppDrilldown({truth}:Props){
  const [selected,setSelected]=useState<(typeof QL375_SHELLS)[number]['id']>('yw');
  const detailHeading=useRef<HTMLHeadingElement>(null);
  const navigated=useRef(false);
  const shell=QL375_SHELLS.find(item=>item.id===selected)!;
  const status=ownerShellStatus(truth);
  const contract=MASTER_SHELL_REGISTRY.find(item=>item.id===selected)!;
  const identityClaims=reconcileSourceIdentities([]);

  useEffect(()=>{if(navigated.current)detailHeading.current?.focus();},[selected]);
  return <div className="ql375-drilldown">
    <p id="ql375-six-context">Six fixed platform and support identities. The protected status is an <strong>aggregate six-shell readback</strong>; it is not six independent source pings, a live connection grant or tenant access.</p>
    <section className="ql386-registry" aria-labelledby="ql386-registry-title">
      <h4 id="ql386-registry-title">Master Shell integration registry · expected contracts</h4>
      <p>Identity registry: {MASTER_SHELL_REGISTRY.length} approved shell-level sources. Independent source identity claims received here: 0. All {identityClaims.filter(item=>item.state==='MISSING').length} are awaiting claim reconciliation; no connection or enrollment is inferred from this catalogue.</p>
      <p>Source IDs, repositories and health handlers are the approved software contract; tenant businesses are not additional source identities. AI Data Platform owns module completion evidence, while Comms Hub owns authorized communications and incident routing.</p>
    </section>
    <div className="ql375-source-grid" aria-label="Read-only six-app source cards">
      {QL375_SHELLS.map(item=><button type="button" key={item.id}
        className={selected===item.id?'ql375-source-card ql375-active':'ql375-source-card'}
        onClick={()=>{navigated.current=true;setSelected(item.id);}}
        aria-pressed={selected===item.id} aria-controls="ql375-source-detail">
        <strong>{item.name}</strong><small>Source ID: {item.id}</small>
        <span className={`ql375-status ql375-${status.kind}`}>{status.label}</span>
      </button>)}
    </div>
    <section id="ql375-source-detail" aria-labelledby="ql375-detail-title" className="ql375-source-detail">
      <h4 tabIndex={-1} ref={detailHeading} id="ql375-detail-title">{shell.name} · source details</h4>
      <dl><div><dt>Source ID</dt><dd><code>{shell.id}</code></dd></div>
        <div><dt>Repository identity</dt><dd><code>{shell.repository}</code></dd></div>
        <div><dt>Expected health handler</dt><dd><code>{contract.handler}</code></dd></div>
        <div><dt>Registry reconciliation</dt><dd>Awaiting source identity claim · not connected by inference</dd></div>
        <div><dt>Authority boundary</dt><dd>{contract.connectionAuthority}</dd></div>
        <div><dt>Tenant boundary</dt><dd>{shell.boundary}</dd></div>
        <div><dt>Connection evidence</dt><dd>{status.label}</dd></div></dl>
      <p role={status.kind==='stop'?'alert':'status'}>{status.detail}</p>
      <p><strong>Private TEST, customer data, connection changes and source activation: not authorized.</strong></p>
      {truth.snapshotAt&&<small>Aggregate server readback at {new Date(truth.snapshotAt).toLocaleString()} · expires after two minutes</small>}
    </section>
    <nav aria-label="Safe owner help navigation" className="ql375-help">
      <h4>Safe help and next steps</h4>
      <ul>{QL375_HELP_LINKS.map(link=><li key={link.id}>
        <a href={link.href} {...(link.href.startsWith('https://')?{target:'_blank',rel:'noopener noreferrer'}:{})}>{link.label}</a>
        <small>{link.description}</small>
      </li>)}</ul>
      <p>Help links never submit enrollment, change permissions or open customer records.</p>
    </nav>
  </div>;
}
