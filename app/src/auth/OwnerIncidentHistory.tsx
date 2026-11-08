import {useEffect,useRef,useState} from 'react';
import type {OwnerIncidentHistory as HistoryState} from './ql377OwnerIncidentHistory';
import {incidentAgeLabel,ownerIncidentResolutionGuidance} from './ql377OwnerIncidentHistory';
import './ql377OwnerIncidentHistory.css';

type Filter='all'|'showing'|'ended';
export function OwnerIncidentHistory({history,nowMs,authenticated}:{
  history:HistoryState;nowMs:number;authenticated:boolean;
}){
  const [filter,setFilter]=useState<Filter>('all');
  const [selected,setSelected]=useState<number|null>(null);
  const detailHeading=useRef<HTMLHeadingElement>(null);
  const navigated=useRef(false);
  const entries=authenticated?history.observations:[];
  const visible=entries.filter(entry=>filter==='all'||(filter==='showing'?entry.noLongerShownMs===null:entry.noLongerShownMs!==null))
    .slice().reverse();
  const chosen=visible.find(entry=>entry.sequence===selected)??visible[0];
  useEffect(()=>{if(navigated.current&&chosen)detailHeading.current?.focus();},[selected,filter,chosen?.sequence]);
  return <section className="ql377-history" aria-labelledby="ql377-history-title">
    <h4 id="ql377-history-title">Owner incident observation history</h4>
    <p>This is a bounded history of alerts <em>seen in this open owner shell</em>, not server incident history or source audit evidence. It is kept in memory only, and clears when our MFA session ends or the owner changes.</p>
    <div className="ql377-controls">
      <label htmlFor="ql377-filter">Review session observations</label>
      <select id="ql377-filter" value={filter} onChange={event=>{navigated.current=false;setFilter(event.target.value as Filter);}}>
        <option value="all">All observed alerts</option>
        <option value="showing">Still displayed</option>
        <option value="ended">No longer displayed</option>
      </select>
      <span role="status" aria-live="polite">{visible.length} of {entries.length} session observations</span>
    </div>
    <div className="ql377-layout">
      <div className="ql377-observations" aria-label="Session alert observations">
        {visible.length===0?<p>No observations match this view. This does not certify source health or incident resolution.</p>:
          visible.map(entry=><button type="button" key={entry.sequence}
            className={chosen?.sequence===entry.sequence?'ql377-item ql377-selected':'ql377-item'}
            aria-pressed={chosen?.sequence===entry.sequence} aria-controls="ql377-detail"
            onClick={()=>{navigated.current=true;setSelected(entry.sequence);}}>
            <strong>{entry.title}</strong>
            <small>{entry.category} · {entry.severity} · {entry.noLongerShownMs===null?'Still displayed':'No longer displayed'}</small>
          </button>)}
      </div>
      <section id="ql377-detail" className="ql377-detail" aria-labelledby="ql377-detail-title">
        {chosen?<>
          <h5 id="ql377-detail-title" tabIndex={-1} ref={detailHeading}>{chosen.title}</h5>
          <p><strong>Observed for:</strong> {incidentAgeLabel(chosen.firstSeenMs,chosen.noLongerShownMs??nowMs)}. <strong>Current display:</strong> {chosen.noLongerShownMs===null?'Still showing':'No longer showing; not independently resolved'}.</p>
          <p><strong>First seen in this session:</strong> {new Date(chosen.firstSeenMs).toLocaleString()}</p>
          <p><strong>Last associated server snapshot:</strong> {new Date(chosen.snapshotAt).toLocaleString()}</p>
          <p>{chosen.detail}</p>
          <p><strong>Original guidance:</strong> {chosen.nextStep}</p>
          <p><strong>Safe resolution guidance:</strong> {ownerIncidentResolutionGuidance(chosen)}</p>
        </>:<><h5 id="ql377-detail-title">No session observations</h5><p>Refresh the authenticated owner status to review available evidence. No history is inferred.</p></>}
      </section>
    </div>
    <p className="ql377-boundary">“No longer displayed” means this shell's alert view changed. It never confirms a source repaired an incident or authorized a connection. <a href="#ql370-refresh-status">Open protected status refresh</a>.</p>
  </section>;
}
