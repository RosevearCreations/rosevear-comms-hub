import {useEffect,useRef,useState} from 'react';
import type {OwnerIncidentHistory as HistoryState} from './ql377OwnerIncidentHistory';
import {incidentAgeLabel,ownerIncidentResolutionGuidance} from './ql377OwnerIncidentHistory';
import {OWNER_EVIDENCE_LABELS,ownerIncidentTriage} from './ql378OwnerIncidentTriage';
import './ql377OwnerIncidentHistory.css';

type Filter='all'|'showing'|'ended';
type Severity='all'|'action'|'warning'|'information';
export function OwnerIncidentHistory({history,nowMs,authenticated}:{
  history:HistoryState;nowMs:number;authenticated:boolean;
}){
  const [filter,setFilter]=useState<Filter>('all');
  const [severity,setSeverity]=useState<Severity>('all');
  const [search,setSearch]=useState('');
  const [groupRepeats,setGroupRepeats]=useState(true);
  const [selected,setSelected]=useState<string|null>(null);
  const detailHeading=useRef<HTMLHeadingElement>(null);
  const navigated=useRef(false);
  useEffect(()=>{
    setSearch('');setSelected(null);setFilter('all');setSeverity('all');setGroupRepeats(true);
    navigated.current=false;
  },[history.role,authenticated]);
  const entries=authenticated?history.observations:[];
  const visible=ownerIncidentTriage(entries,{nowMs,search,status:filter,severity,groupRepeats});
  const chosen=visible.find(group=>group.id===selected)??visible[0];
  const represented=visible.reduce((sum,group)=>sum+group.occurrences.length,0);
  useEffect(()=>{if(navigated.current&&chosen)detailHeading.current?.focus();},[selected,filter,severity,search,groupRepeats,chosen?.id]);
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
      <label htmlFor="ql378-search">Search alerts</label>
      <input id="ql378-search" type="search" maxLength={100} value={authenticated?search:''}
        placeholder="Title, category or guidance" onChange={event=>{navigated.current=false;setSearch(event.target.value);}}/>
      {search&&<button type="button" onClick={()=>{navigated.current=false;setSearch('');}}>Clear search</button>}
      <label htmlFor="ql378-severity">Severity</label>
      <select id="ql378-severity" value={severity}
        onChange={event=>{navigated.current=false;setSeverity(event.target.value as Severity);}}>
        <option value="all">All severities</option><option value="action">Action</option>
        <option value="warning">Warning</option><option value="information">Information</option>
      </select>
      <label className="ql378-group-toggle" htmlFor="ql378-group">
        <input id="ql378-group" type="checkbox" checked={groupRepeats}
          onChange={event=>{navigated.current=false;setGroupRepeats(event.target.checked);}}/>
        Group repeated alerts
      </label>
      <span role="status" aria-live="polite">{represented} of {entries.length} session observations · {visible.length} triage {visible.length===1?'item':'items'}</span>
    </div>
    <div className="ql377-layout">
      <div className="ql377-observations" aria-label="Session alert observations">
        {visible.length===0?<p>No observations match this view. This does not certify source health or incident resolution.</p>:
          visible.map(group=><button type="button" key={group.id}
            className={chosen?.id===group.id?'ql377-item ql377-selected':'ql377-item'}
            aria-pressed={chosen?.id===group.id} aria-controls="ql377-detail"
            onClick={()=>{navigated.current=true;setSelected(group.id);}}>
            <strong>{group.latest.title}</strong>
            <small>{group.latest.category} · {group.latest.severity} · {group.priority.replace('-', ' ')} · {group.stillDisplayed?'Still displayed':'No longer displayed'}</small>
            {group.occurrences.length>1&&<small>{group.occurrences.length} distinct session observations, grouped for review</small>}
          </button>)}
      </div>
      <section id="ql377-detail" className="ql377-detail" aria-labelledby="ql377-detail-title">
        {chosen?<>
          <h5 id="ql377-detail-title" tabIndex={-1} ref={detailHeading}>{chosen.latest.title}</h5>
          <p><strong>Triage:</strong> {chosen.priority.replace('-', ' ')}. <strong>Evidence:</strong> {OWNER_EVIDENCE_LABELS[chosen.evidence]}.</p>
          <p><strong>Observed for:</strong> {incidentAgeLabel(chosen.latest.firstSeenMs,chosen.latest.noLongerShownMs??nowMs)}. <strong>Current display:</strong> {chosen.latest.noLongerShownMs===null?'Still showing':'No longer showing; not independently resolved'}.</p>
          <p><strong>First seen in this session:</strong> {new Date(chosen.latest.firstSeenMs).toLocaleString()}</p>
          <p><strong>Last associated server snapshot:</strong> {new Date(chosen.latest.snapshotAt).toLocaleString()}</p>
          <p>{chosen.latest.detail}</p>
          <p><strong>Original guidance:</strong> {chosen.latest.nextStep}</p>
          <p><strong>Safe resolution guidance:</strong> {ownerIncidentResolutionGuidance(chosen.latest)}</p>
          {chosen.occurrences.length>1&&<div className="ql378-episodes">
            <strong>{chosen.occurrences.length} separate observations</strong>
            <ol aria-label="Individual observed alert episodes">{chosen.occurrences.map(entry=><li key={entry.sequence}>
              Seen {new Date(entry.firstSeenMs).toLocaleString()}; duration {incidentAgeLabel(entry.firstSeenMs,entry.noLongerShownMs??nowMs)}; {entry.noLongerShownMs===null?'still displayed':'no longer displayed, not independently resolved'}.
            </li>)}</ol>
          </div>}
        </>:<><h5 id="ql377-detail-title">No session observations</h5><p>Refresh the authenticated owner status to review available evidence. No history is inferred.</p></>}
      </section>
    </div>
    <p className="ql377-boundary">Search, priority and grouping affect this browser view only. A recent aggregate is not six live source confirmations; “no longer displayed” never means independently resolved. <a href="#ql370-refresh-status">Open protected status refresh</a>.</p>
  </section>;
}
