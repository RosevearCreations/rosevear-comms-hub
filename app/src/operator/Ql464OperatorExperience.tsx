import {useRef,useState,type KeyboardEvent} from 'react';
import {ql464Sources,ql464SourceStatus,ql464SampleTasks,ql464TaskMatches,ql464EvidenceTimeline,type Ql464SourceId} from './ql464OperatorSource';
import './ql464-operator-experience.css';

/** Safe browser-only preview: never dispatches, verifies signatures or changes a peer. */
export function Ql464OperatorExperience(){
  const [query,setQuery]=useState('');
  const [source,setSource]=useState<Ql464SourceId|'all'>('all');
  const [reviewed,setReviewed]=useState<Record<string,boolean>>({});
  const searchRef=useRef<HTMLInputElement>(null);
  const visible=ql464SampleTasks.filter(task=>ql464TaskMatches(task,query,source));
  const reviewedCount=ql464SampleTasks.filter(task=>reviewed[task.id]).length;
  function shortcut(event:KeyboardEvent<HTMLElement>){
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    const node=event.target as HTMLElement;
    const isEditing=['INPUT','TEXTAREA','SELECT'].includes(node.tagName)||node.isContentEditable;
    if(event.key==='/'&&!isEditing){event.preventDefault();searchRef.current?.focus();}
    if(event.key==='Escape'&&!isEditing&&query){event.preventDefault();setQuery('');}
  }
  return <section className="ql464" tabIndex={0} onKeyDown={shortcut}
    aria-labelledby="ql464-title" data-ql464-live-state="unverified">
    <header className="ql464-hero">
      <div><p className="ql464-kicker">QL-464 · OPERATOR COMMAND DESK</p>
        <h2 id="ql464-title">Communications, incidents &amp; action review</h2>
        <p>Unified, responsive source-state and action workspace. Display-only, no live dispatch.</p></div>
      <div className="ql464-hold" role="status">
        <small>LIVE SOURCE STATE</small><strong>UNVERIFIED</strong>
        <span>No signed live peer or incident feed is accepted in this panel.</span>
      </div>
    </header>
    <div className="ql464-stats" aria-label="Operator summary">
      <article><span>Application sources</span><strong>{ql464Sources.length}</strong><small>All unverified</small></article>
      <article><span>Verified live incidents</span><strong>—</strong><small>No authenticated feed</small></article>
      <article><span>Sample tasks</span><strong>{ql464SampleTasks.length}</strong><small>{reviewedCount} reviewed locally</small></article>
      <article><span>CX +10pp acceptance</span><strong>Not measured</strong><small>Baseline/evidence pending</small></article>
    </div>
    <div className="ql464-columns">
      <section className="ql464-panel" id="ql464-inbox" aria-labelledby="ql464-inbox-title">
        <p className="ql464-kicker">UNIFIED REVIEW INBOX · SAMPLE ONLY</p><h3 id="ql464-inbox-title">Owner action worklist</h3>
        <p>These are sample review prompts. Local choices never change a customer, source app or incident.</p>
        <div className="ql464-filters">
          <label htmlFor="ql464-search">Search tasks (focus this panel, then press /)</label>
          <input type="search" id="ql464-search" ref={searchRef} value={query}
            onChange={e=>setQuery(e.target.value)} placeholder="App or task…" aria-keyshortcuts="/" />
          <label htmlFor="ql464-app">Application</label>
          <select id="ql464-app" value={source} onChange={e=>setSource(e.target.value as Ql464SourceId|'all')}>
            <option value="all">All applications</option>
            {ql464Sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="button" onClick={()=>{setQuery('');setSource('all');searchRef.current?.focus();}}>Reset filters</button>
        </div>
        <p className="ql464-count" role="status">{visible.length} sample tasks shown</p>
        <ul className="ql464-tasks">
          {visible.map(task=><li key={task.id}>
            <div><small>{ql464Sources.find(s=>s.id===task.source)?.name} · SAMPLE</small>
            <strong>{task.title}</strong><p>{task.action}</p></div>
            <button type="button" aria-pressed={!!reviewed[task.id]}
              onClick={()=>setReviewed(old=>({...old,[task.id]:!old[task.id]}))}>
              {reviewed[task.id]?'Reopen sample':'Mark sample reviewed'}
            </button>
          </li>)}
          {visible.length===0&&<li>No matching samples. No live tasks were queried.</li>}
        </ul>
      </section>
      <section className="ql464-panel" id="ql464-incidents" aria-labelledby="ql464-incidents-title">
        <p className="ql464-kicker">INCIDENT / ACTION TIMELINE</p><h3 id="ql464-incidents-title">Evidence handoff chronology</h3>
        <p>Outstanding evidence types, not recorded incidents or fabricated timestamps.</p>
        <ol className="ql464-timeline">{ql464EvidenceTimeline.map(e=><li key={e.id}>
          <div><strong>{e.title}</strong><span className="ql464-state">{e.state}</span></div>
          <p>{e.detail}</p><small>Verified event time: unavailable</small>
        </li>)}</ol>
      </section>
    </div>
    <section className="ql464-panel" id="ql464-connectivity" aria-labelledby="ql464-connectivity-title">
      <p className="ql464-kicker">SEVEN-APPLICATION CONNECTIVITY / NO PHANTOM GREEN</p>
      <h3 id="ql464-connectivity-title">Source-state display</h3>
      <p>Production GitHub code, deployments and preview receipts are not evidence of live peer acceptance.</p>
      <div className="ql464-sources" role="list">{ql464Sources.map(s=><article role="listitem" key={s.id}>
        <div><strong>{s.name}</strong><small>{s.role}</small></div>
        <span className="ql464-state" aria-label={s.name+' connectivity unverified'}>{ql464SourceStatus(s.id)}</span>
        <small>Independent signer, health and owner receipt: not supplied</small>
      </article>)}</div>
    </section>
    <section className="ql464-score" aria-labelledby="ql464-score-title">
      <h3 id="ql464-score-title">Measured CX +10 percentage-point tranche</h3>
      <p><strong>Accepted baseline: not independently established.</strong> The target is +10 percentage points
         against a measured baseline, not an automatic release claim. UI code and simulated checks do not
         prove an achieved improvement.</p>
      <p>Outstanding owner evidence: keyboard, screen reader, tablet/mobile/desktop, zoom, contrast,
         cross-tenant source denials and independent signed acceptance.</p>
    </section>
  </section>;
}
