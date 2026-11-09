import {useEffect,useRef,useState} from 'react';
import type {KeyboardEvent} from 'react';
import type {OwnerIncidentHistory as HistoryState} from './ql377OwnerIncidentHistory';
import {incidentAgeLabel,ownerIncidentResolutionGuidance} from './ql377OwnerIncidentHistory';
import {OWNER_EVIDENCE_LABELS,ownerIncidentTriage} from './ql378OwnerIncidentTriage';
import {ownerReviewPreset,type OwnerReviewPreset} from './ql379OwnerReviewPresets';
import './ql377OwnerIncidentHistory.css';

type Filter='all'|'showing'|'ended';
type Severity='all'|'action'|'warning'|'information';
type ReviewSnapshot={filter:Filter;severity:Severity;search:string;groupRepeats:boolean};
type SavedReview=ReviewSnapshot&{id:number;bookmarks:number[];reviewed:number[];bookmarkedOnly:boolean};
type LocalHandoff={id:number;atMs:number;reviewed:number;total:number;outstanding:number;bookmarked:number};
export function OwnerIncidentHistory({history,nowMs,authenticated}:{
  history:HistoryState;nowMs:number;authenticated:boolean;
}){
  const [filter,setFilter]=useState<Filter>('all');
  const [severity,setSeverity]=useState<Severity>('all');
  const [search,setSearch]=useState('');
  const [groupRepeats,setGroupRepeats]=useState(true);
  const [selected,setSelected]=useState<string|null>(null);
  const [bookmarks,setBookmarks]=useState<number[]>([]);
  const [bookmarkedOnly,setBookmarkedOnly]=useState(false);
  const [previousReview,setPreviousReview]=useState<ReviewSnapshot|null>(null);
  const [reviewedSequences,setReviewedSequences]=useState<number[]>([]);
  const [savedReviews,setSavedReviews]=useState<SavedReview[]>([]);
  const [closedReview,setClosedReview]=useState<{reviewed:number;total:number;bookmarked:number}|null>(null);
  const [handoffHistory,setHandoffHistory]=useState<LocalHandoff[]>([]);
  const nextHandoffId=useRef(1);
  const nextSaveId=useRef(1);
  const detailHeading=useRef<HTMLHeadingElement>(null);
  const observationList=useRef<HTMLDivElement>(null);
  const navigated=useRef(false);
  useEffect(()=>{
    setSearch('');setSelected(null);setFilter('all');setSeverity('all');setGroupRepeats(true);
    setBookmarks([]);setBookmarkedOnly(false);setPreviousReview(null);
    setReviewedSequences([]);setSavedReviews([]);nextSaveId.current=1;
    setClosedReview(null);
    setHandoffHistory([]);nextHandoffId.current=1;
    navigated.current=false;
  },[history.role,authenticated]);
  const entries=authenticated?history.observations:[];
  const activeBookmarks=bookmarks.filter(sequence=>entries.some(entry=>entry.sequence===sequence));
  const activeReviewed=reviewedSequences.filter(sequence=>entries.some(entry=>entry.sequence===sequence));
  const reviewed=ownerIncidentTriage(entries,{nowMs,search,status:filter,severity,groupRepeats});
  const visible=bookmarkedOnly?reviewed.filter(group=>group.occurrences.some(entry=>activeBookmarks.includes(entry.sequence))):reviewed;
  const chosen=visible.find(group=>group.id===selected)??visible[0];
  const chosenSequences=chosen?.occurrences.map(entry=>entry.sequence)??[];
  const chosenBookmarked=chosenSequences.some(sequence=>activeBookmarks.includes(sequence));
  const unreviewed=visible.filter(group=>group.occurrences.some(entry=>!activeReviewed.includes(entry.sequence)));
  const outstanding=entries.filter(entry=>!activeReviewed.includes(entry.sequence)).length;
  const filteredOutstanding=visible.reduce((sum,group)=>sum+group.occurrences.filter(entry=>!activeReviewed.includes(entry.sequence)).length,0);
  const markReviewed=(sequences:number[])=>setReviewedSequences(current=>
    [...current.filter(sequence=>entries.some(entry=>entry.sequence===sequence)),...sequences.filter(sequence=>!current.includes(sequence))].slice(-40));
  const saveReview=()=>{
    if(!authenticated)return;
    const snapshot:SavedReview={id:nextSaveId.current++,filter,severity,search,groupRepeats,
      bookmarks:activeBookmarks,reviewed:activeReviewed,bookmarkedOnly};
    setSavedReviews(current=>[...current,snapshot].slice(-5));
  };
  const nextUnreviewed=()=>{
    const next=unreviewed.find(group=>group.id!==chosen?.id)??unreviewed[0];
    if(!next)return;
    navigated.current=true;
    setSelected(next.id);
    markReviewed(next.occurrences.map(entry=>entry.sequence));
  };
  const closeReview=()=>{
    if(!authenticated)return;
    setHandoffHistory(current=>[...current,{id:nextHandoffId.current++,atMs:nowMs,
      reviewed:activeReviewed.length,total:entries.length,outstanding,bookmarked:activeBookmarks.length}].slice(-5));
    setClosedReview({reviewed:activeReviewed.length,total:entries.length,bookmarked:activeBookmarks.length});
    setSavedReviews([]);setBookmarks([]);setReviewedSequences([]);
    setSelected(null);setPreviousReview(null);setSearch('');setFilter('all');setSeverity('all');
    setGroupRepeats(true);setBookmarkedOnly(false);navigated.current=false;
  };
  const loadReview=(saved:SavedReview)=>{
    if(!authenticated)return;
    navigated.current=false;
    setFilter(saved.filter);setSeverity(saved.severity);setSearch(saved.search);
    setGroupRepeats(saved.groupRepeats);setBookmarkedOnly(saved.bookmarkedOnly);
    setBookmarks(saved.bookmarks.filter(sequence=>entries.some(entry=>entry.sequence===sequence)));
    setReviewedSequences(saved.reviewed.filter(sequence=>entries.some(entry=>entry.sequence===sequence)));
    setSelected(null);
  };
  const toggleBookmark=()=>{
    if(!chosen)return;
    setBookmarks(current=>chosenBookmarked?current.filter(sequence=>!chosenSequences.includes(sequence)):
      [...current.filter(sequence=>entries.some(entry=>entry.sequence===sequence)),...chosenSequences.filter(sequence=>!current.includes(sequence))].slice(-40));
  };
  const represented=visible.reduce((sum,group)=>sum+group.occurrences.length,0);
  const showing=visible.filter(group=>group.stillDisplayed).length;
  const action=visible.filter(group=>group.stillDisplayed&&group.latest.severity==='action').length;
  const needingEvidence=visible.filter(group=>group.priority==='verify-evidence').length;
  const navigateItems=(event:KeyboardEvent<HTMLDivElement>)=>{
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key)||visible.length===0)return;
    if(!(event.target instanceof HTMLButtonElement)||!event.target.classList.contains('ql377-item'))return;
    event.preventDefault();
    const buttons=[...(observationList.current?.querySelectorAll<HTMLButtonElement>('.ql377-item')??[])];
    const current=buttons.indexOf(event.target);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
      (current+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
    navigated.current=false;
    setSelected(visible[next].id);
    buttons[next]?.focus();
  };
  const applyPreset=(preset:OwnerReviewPreset)=>{
    const next=ownerReviewPreset(preset);
    setPreviousReview({filter,severity,search,groupRepeats});
    navigated.current=false;
    setBookmarkedOnly(false);setSearch(next.search);setFilter(next.status);
    setSeverity(next.severity);setGroupRepeats(next.groupRepeats);
  };
  const restoreReview=()=>{
    if(!previousReview)return;
    navigated.current=false;
    setFilter(previousReview.filter);setSeverity(previousReview.severity);
    setSearch(previousReview.search);setGroupRepeats(previousReview.groupRepeats);
    setPreviousReview(null);
  };
  useEffect(()=>{if(navigated.current&&chosen)detailHeading.current?.focus();},[selected,filter,severity,search,groupRepeats,chosen?.id]);
  return <section className="ql377-history" aria-labelledby="ql377-history-title">
    <h4 id="ql377-history-title">Owner incident observation history</h4>
    <p>This is a bounded history of alerts <em>seen in this open owner shell</em>, not server incident history or source audit evidence. It is kept in memory only, and clears when our MFA session ends or the owner changes.</p>
    <section className="ql384-history" aria-labelledby="ql384-history-title">
      <h5 id="ql384-history-title">Local review handoff history</h5>
      <p>Only counts from up to five closeouts in this authenticated owner session are retained. They do not survive a sign-out, owner change, reload or another device. No cross-session evidence, incident audit record or independently verified resolution is created.</p>
      {handoffHistory.length===0?<p>No local handoffs recorded in this session.</p>:<ol>{handoffHistory.map(item=><li key={item.id}>
        Handoff {item.id}: {item.reviewed} of {item.total} episodes opened; {item.outstanding} not opened; {item.bookmarked} bookmarks at closeout. Captured {new Date(item.atMs).toLocaleString()} (local review only).
      </li>)}</ol>}
      {handoffHistory.length>0&&<button type="button" onClick={()=>setHandoffHistory([])}>Clear local handoff history</button>}
    </section>
    {closedReview?<section className="ql383-closeout" aria-label="Closed local review summary" role="status">
      <h5>Local review closed</h5>
      <p>{closedReview.reviewed} of {closedReview.total} observed episodes were opened; {closedReview.bookmarked} were bookmarked before closeout. In-memory review marks, bookmarks and saved views were cleared. This does not close, resolve, approve or notify any source incident.</p>
      <button type="button" onClick={()=>setClosedReview(null)}>Start a new local review</button>
    </section>:<>
    <div className="ql377-controls">
      <div role="group" aria-label="Session review shortcuts" className="ql379-presets">
        <span>Review shortcuts (this session only):</span>
        <button type="button" onClick={()=>applyPreset('all')}>All alerts</button>
        <button type="button" onClick={()=>applyPreset('urgent')}>Action needed</button>
        <button type="button" onClick={()=>applyPreset('active')}>Still displayed</button>
        <button type="button" onClick={()=>applyPreset('historical')}>No longer displayed</button>
      </div>
      <div role="group" aria-label="Session review continuity" className="ql381-review-controls">
        <button type="button" disabled={!previousReview} onClick={restoreReview}>Restore previous filters</button>
        <label htmlFor="ql381-bookmarked-only"><input id="ql381-bookmarked-only" type="checkbox" checked={bookmarkedOnly} onChange={event=>{navigated.current=false;setBookmarkedOnly(event.target.checked);}}/> Bookmarked only ({activeBookmarks.length} observations)</label>
      </div>
      <div role="group" aria-label="Saved session review views" className="ql382-review-sessions">
        <button type="button" disabled={!authenticated} onClick={saveReview}>Save current session view</button>
        {savedReviews.map(saved=><button type="button" key={saved.id} onClick={()=>loadReview(saved)} aria-label={`Restore saved view ${saved.id}`}>View {saved.id}</button>)}
        {savedReviews.length>0&&<button type="button" onClick={()=>setSavedReviews([])}>Clear saved views</button>}
        <span>{savedReviews.length} of 5 in-memory saved views</span>
      </div>
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
    <p className="ql380-summary" aria-label="Filtered session review summary">Review summary: {showing} still displayed, {action} action-level still displayed, {needingEvidence} needing evidence verification, {visible.length-showing} no longer displayed. These are grouped session observations, not independent incident resolutions or six source confirmations.</p>
    <section className="ql382-handoff" aria-labelledby="ql382-handoff-title">
      <h5 id="ql382-handoff-title">Session review progress and handoff summary</h5>
      <progress max={Math.max(entries.length,1)} value={activeReviewed.length} aria-label="Observed alert episodes opened for review"/>
      <p role="status">{activeReviewed.length} of {entries.length} observed alert episodes opened for review ({entries.length?Math.round(activeReviewed.length/entries.length*100):0}%). {activeBookmarks.length} bookmarked observations. Progress means viewed here, not independently verified or resolved.</p>
      <p className="ql384-outstanding" role="status">Outstanding review work: {outstanding} of {entries.length} observed episodes not opened in this local review; {filteredOutstanding} are in the current filtered results. Changing filters does not discard prior review marks. These counts are not unresolved incident totals.</p>
      <p>Read-only handoff note: {visible.length} filtered groups; {showing} still displayed; {needingEvidence} needing evidence verification. No messages sent, approvals granted, or incident status changed. This summary exists only in the authenticated owner session.</p>
      <div className="ql383-actions" role="group" aria-label="Review progress and local closeout">
        <button type="button" disabled={unreviewed.length===0} onClick={nextUnreviewed}>Open next unreviewed alert ({unreviewed.length} groups)</button>
        <button type="button" onClick={closeReview}>Close local review and clear session notes</button>
      </div>
      <p>{unreviewed.length===0?'No unreviewed groups in this filtered view. Other filters may contain unreviewed observations.':`${unreviewed.length} filtered groups include episodes not yet opened.`} Review progress stays in this owner session when filters change; it is not evidence of resolution.</p>
    </section>
    <p id="ql380-keyboard-help">On an alert, use Up/Down arrows or Home/End to move between results. Press Enter to move focus to the selected detail.</p>
    <div className="ql377-layout">
      <div className="ql377-observations" ref={observationList} onKeyDown={navigateItems} aria-label="Session alert observations" aria-describedby="ql380-keyboard-help">
        {visible.length===0?<p>No observations match this view. This does not certify source health or incident resolution.</p>:
          visible.map(group=><button type="button" key={group.id}
            className={chosen?.id===group.id?'ql377-item ql377-selected':'ql377-item'}
            aria-pressed={chosen?.id===group.id} aria-controls="ql377-detail"
            aria-label={`${group.latest.title}; ${group.latest.severity}; ${group.stillDisplayed?'still displayed':'no longer displayed'}`}
            onClick={()=>{navigated.current=true;setSelected(group.id);markReviewed(group.occurrences.map(entry=>entry.sequence));if(chosen?.id===group.id)detailHeading.current?.focus();}}>
            <strong>{group.latest.title}</strong>
            <small>{group.latest.category} · {group.latest.severity} · {group.priority.replace('-', ' ')} · {group.stillDisplayed?'Still displayed':'No longer displayed'}</small>
            {group.occurrences.length>1&&<small>{group.occurrences.length} distinct session observations, grouped for review</small>}
          </button>)}
      </div>
      <section id="ql377-detail" className="ql377-detail" aria-labelledby="ql377-detail-title" onKeyDown={event=>{
        if(event.key==='Escape'&&chosen){event.preventDefault();observationList.current?.querySelectorAll<HTMLButtonElement>('.ql377-item')[visible.indexOf(chosen)]?.focus();}
      }}>
        {chosen?<>
          <h5 id="ql377-detail-title" tabIndex={-1} ref={detailHeading}>{chosen.latest.title}</h5>
          <button type="button" aria-pressed={chosenBookmarked} onClick={toggleBookmark}>{chosenBookmarked?'Remove session bookmark':'Bookmark this session alert'}</button>
          <p>Bookmark applies only to observed episodes in this open owner session. Press Escape here to return to the selected result.</p>
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
    </>}
  </section>;
}
