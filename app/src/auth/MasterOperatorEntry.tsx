import {useEffect,useRef,useState} from 'react';
import type {OwnerProgress} from './ql370OwnerProgress';
import {OWNER_ENTRY_SECTIONS,QL374_HISTORICAL_PREREQUISITES,QL374_REQUIRED_GATES,
  ownerEntryTruth,type OwnerEntryRole,type OwnerEntrySection} from './ql374OwnerEntry';
import './ql374OwnerEntry.css';

type Props={ownerRole:OwnerEntryRole;enrolled:boolean;aal2:boolean;
  progress:OwnerProgress|null};

/** QL-374 is a personal, status-only operator landing. No provider, customer,
 * tenant, Auth mutation, new request, credential or connection operation exists. */
export function MasterOperatorEntry({ownerRole,enrolled,aal2,progress}:Props){
  const [section,setSection]=useState<OwnerEntrySection>('home');
  const [nowMs,setNowMs]=useState(()=>Date.now());
  const heading=useRef<HTMLHeadingElement>(null);
  const didNavigate=useRef(false);
  const truth=ownerEntryTruth({role:ownerRole,enrolled,aal2,progress,nowMs});
  const name=ownerRole==='source'?'Ree':'Jack';

  useEffect(()=>{
    const timer=window.setInterval(()=>setNowMs(Date.now()),15000);
    return ()=>window.clearInterval(timer);
  },[]);

  useEffect(()=>{
    if(didNavigate.current)heading.current?.focus();
  },[section]);
  function navigate(next:OwnerEntrySection){didNavigate.current=true;setSection(next);}
  const active=OWNER_ENTRY_SECTIONS.find(x=>x.id===section)!;

  return <section className="ql374-entry" aria-labelledby="ql374-title">
    <header className="ql374-heading">
      <p className="ql370-eyebrow">QL-374 · PERSONAL OWNER OPERATOR SHELL</p>
      <h2 id="ql374-title">Welcome, {name}</h2>
      <p>We are signed in under an individual owner identity. This is a read-only operator starting point; a personal login is not permission to open a customer's business, use a provider or release a source.</p>
      <span className={truth.state==='STOP_REVIEW'?'ql374-badge ql374-stop':'ql374-badge'}
        role={truth.state==='STOP_REVIEW'?'alert':'status'}>{truth.label}</span>
    </header>
    <nav className="ql374-nav" aria-label="Owner operator shell sections">
      {OWNER_ENTRY_SECTIONS.map(item=><button type="button" key={item.id}
        onClick={()=>navigate(item.id)} aria-current={section===item.id?'page':undefined}
        aria-controls="ql374-current-section" className={section===item.id?'ql374-selected':''}>
        <strong>{item.label}</strong><small>{item.description}</small>
      </button>)}
    </nav>
    <section id="ql374-current-section" className="ql374-panel"
      aria-labelledby="ql374-current-heading">
      <h3 id="ql374-current-heading" ref={heading} tabIndex={-1}>{active.label}</h3>
      <p className="ql374-announcement" role="status" aria-live="polite" aria-atomic="true">
        Viewing {active.label}. {truth.label}.
      </p>
      {section==='home'&&<>
        <div className="ql374-cards">
          <article><span>Personal identity</span><strong>{name}</strong><small>Server-verified owner role · no shared account</small></article>
          <article><span>Authenticator</span><strong>{aal2?'AAL2 verified':'AAL2 required'}</strong><small>Each owner completes their own challenge</small></article>
          <article><span>Owner membership</span><strong>{enrolled?'Recorded':'Pending signed approval'}</strong><small>Server decides membership and original signatures</small></article>
          <article><span>Application access</span><strong>Held</strong><small>No customer or source operations authorized</small></article>
        </div>
        <p>Start with the I.T. summary for a recent protected server reading, or open the getting-started guide. Enrollment controls remain below this personal shell.</p>
        <div className="ql374-actions"><button type="button" onClick={()=>navigate('it')}>Review protected I.T. status</button>
          <button type="button" onClick={()=>navigate('start')}>Show first-use guide</button></div>
      </>}
      {section==='it'&&<>
        <div className={truth.state==='STOP_REVIEW'?'ql374-truth ql374-stop':'ql374-truth'}
          role={truth.state==='STOP_REVIEW'?'alert':'status'}>
          <strong>{truth.label}</strong>
          <p>{truth.held?'6 of 6 shell HOLD restrictions were confirmed by the recent protected readback.':
            'A current, matching, consistent protected six-shell readback is not available. Never infer that connections are enabled.'}</p>
          <p>Active owner memberships: {truth.activeMemberships??'Unverified in this view'}. Customer operations and source activation: <strong>NOT AUTHORIZED</strong>.</p>
          {truth.snapshotAt&&<small>Last protected readback: {new Date(truth.snapshotAt).toLocaleString()} (refresh required after two minutes)</small>}
        </div>
        <h4>Historical preflights — no longer launch prerequisites</h4>
        <p>These older screens remain archived for audit, but their dated figures must not block the newer authenticated portal or be presented as current truth.</p>
        <ul>{QL374_HISTORICAL_PREREQUISITES.map(item=><li key={item.id}><strong>{item.label}</strong><p>{item.resolution}</p></li>)}</ul>
        <h4>Security requirements that still apply</h4>
        <ol>{QL374_REQUIRED_GATES.map(s=><li key={s}>{s}</li>)}</ol>
        <a href="#ql370-refresh-status">Go to protected server status refresh</a>
      </>}
      {section==='start'&&<>
        <ol className="ql374-guide">
          <li>Confirm the header names our own account, not a shared Rosevear identity.</li>
          <li>Complete our own authenticator challenge. The shell is not operational authority.</li>
          <li>Open I.T. and security and refresh the protected six-shell status below.</li>
          <li>Review the separate Ree and Jack original-device checklist before any enrollment decision.</li>
          <li>Use the public operator preview for synthetic training only. Private inbox, connection and customer access remain closed until explicit source authorization.</li>
        </ol>
        <div className="ql374-actions"><button type="button" onClick={()=>navigate('it')}>Next: check I.T. status</button>
          <a href="#ql370-refresh-status">Jump to protected enrollment status</a></div>
      </>}
    </section>
    <p className="ql374-boundary"><strong>Safety boundary:</strong> owner authentication, a navigation choice, a historical software GREEN or an old NO-GO packet cannot grant application access. All six independent source approvals remain separate and on HOLD.</p>
  </section>;
}
