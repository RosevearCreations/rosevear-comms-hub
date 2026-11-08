import {useEffect,useRef,useState} from 'react';
import type {OwnerProgress} from './ql370OwnerProgress';
import type {OwnerEntryRole} from './ql374OwnerEntry';
import {ownerEntryTruth} from './ql374OwnerEntry';
import {ownerIncidents,ownerReadbackFreshness,type OwnerIncidentCategory} from './ql376OwnerIncidents';
import './ql376OwnerIncidents.css';

type Props={role:OwnerEntryRole;aal2:boolean;progress:OwnerProgress|null;
  truth:ReturnType<typeof ownerEntryTruth>;nowMs:number};
type Filter='all'|OwnerIncidentCategory;

export function OwnerIncidentReview({role,aal2,progress,truth,nowMs}:Props){
  const [filter,setFilter]=useState<Filter>('all');
  const [selected,setSelected]=useState<string|null>(null);
  const detailHeading=useRef<HTMLHeadingElement>(null);
  const navigated=useRef(false);
  const freshness=ownerReadbackFreshness({progress,role,aal2,nowMs});
  const alerts=ownerIncidents(truth,freshness);
  const visible=filter==='all'?alerts:alerts.filter(alert=>alert.category===filter);
  const chosen=visible.find(alert=>alert.id===selected)??visible[0];
  useEffect(()=>{if(navigated.current&&chosen)detailHeading.current?.focus();},[selected,filter,chosen?.id]);

  return <section className="ql376-review" aria-labelledby="ql376-title">
    <h4 id="ql376-title">Current owner incident review</h4>
    <p>Read-only alerts derived from this owner's protected aggregate status. This is not a live source monitor, an incident acknowledgement or an authorization decision.</p>
    <div className="ql376-freshness" role="status" aria-live="polite">
      <span>Protected readback freshness</span>
      <strong className={`ql376-${freshness.kind}`}>{freshness.label}</strong>
      {freshness.observedAt&&<small>Observed: {new Date(freshness.observedAt).toLocaleString()} · {Math.max(0,freshness.ageSeconds??0)} seconds elapsed</small>}
    </div>
    <div className="ql376-filter">
      <label htmlFor="ql376-category">Filter alerts by category</label>
      <select id="ql376-category" value={filter} onChange={event=>{navigated.current=false;setFilter(event.target.value as Filter);}}>
        <option value="all">All alerts</option>
        <option value="security">Security</option>
        <option value="freshness">Status freshness</option>
        <option value="connection">Connections</option>
      </select>
      <span role="status" aria-live="polite">Showing {visible.length} of {alerts.length} alerts</span>
    </div>
    <div className="ql376-layout">
      <div className="ql376-alerts" aria-label="Read-only owner alerts">
        {visible.length===0?<p>No alerts match this filter. This does not certify source health.</p>:visible.map(alert=><button
          type="button" key={alert.id} className={chosen?.id===alert.id?'ql376-alert ql376-selected':'ql376-alert'}
          aria-pressed={chosen?.id===alert.id} aria-controls="ql376-detail"
          onClick={()=>{navigated.current=true;setSelected(alert.id);}}>
          <strong>{alert.title}</strong><small>{alert.category} · {alert.severity}</small>
        </button>)}
      </div>
      <section id="ql376-detail" className="ql376-detail" aria-labelledby="ql376-detail-title">
        {chosen?<>
          <h5 id="ql376-detail-title" tabIndex={-1} ref={detailHeading}>{chosen.title}</h5>
          <p><strong>Severity:</strong> {chosen.severity}. <strong>Category:</strong> {chosen.category}.</p>
          <p>{chosen.detail}</p><p><strong>Safe next step:</strong> {chosen.nextStep}</p>
        </>:<><h5 id="ql376-detail-title">Nothing in this category</h5><p>Select another filter to review the evidence available.</p></>}
      </section>
    </div>
    <p className="ql376-footer"><a href="#ql370-refresh-status">Refresh protected server status</a> · Updates require the original owner's session. Filtering and selecting an alert never changes a source or customer record.</p>
  </section>;
}
