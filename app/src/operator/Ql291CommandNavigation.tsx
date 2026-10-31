import {useEffect,useState} from 'react';
import type {OperatorWorkspace} from './ql191Organizations';
import type {Ql271CommandMode} from './Ql271CommandSurfaces';
import {activeQl272Profile,defaultQl272Preferences,QL272_ROLE_PREVIEWS,
  type Ql272Density,type Ql272PreferenceEnvelope} from './ql272LayoutPreferences';
import {inspectQl272LocalLayout} from '../storage/localRepository';
import {QL291_GUIDED_ROUTES,QL291_OVERVIEW,ql291QuickDensity,
  ql291Recovery,ql291PreviewSafety} from './ql291CommandNavigation';
import './ql291-command-navigation.css';

export function Ql291CommandNavigation({mode,preferences,saved,storageAvailable,onNavigate,onChange,onRestore,onReset}:{
  mode:Ql271CommandMode;
  preferences:Ql272PreferenceEnvelope;
  saved:boolean;
  storageAvailable:boolean;
  onNavigate:(target:OperatorWorkspace)=>void;
  onChange:(preferences:Ql272PreferenceEnvelope)=>void;
  onRestore:(preferences:Ql272PreferenceEnvelope)=>void;
  onReset:(preferences:Ql272PreferenceEnvelope)=>void;
}){
  const [open,setOpen]=useState(true);
  const [helpId,setHelpId]=useState<string|null>(null);
  const [recovery,setRecovery]=useState(()=>ql291Recovery(inspectQl272LocalLayout()));
  const [feedback,setFeedback]=useState('Guided routes are synthetic/read-only. No external source is contacted.');
  const profile=activeQl272Profile(preferences);
  const role=QL272_ROLE_PREVIEWS.find(item=>item.id===profile.rolePreview)??QL272_ROLE_PREVIEWS[0];
  const safety=ql291PreviewSafety(profile.rolePreview);
  const routes=QL291_GUIDED_ROUTES[mode];

  // Keep the readback aligned with QL-272 editor and quick-density saves.
  // This observes only the already reviewed local layout format and never writes.
  useEffect(()=>{setRecovery(ql291Recovery(inspectQl272LocalLayout()));},[preferences,saved]);

  function changeDensity(density:Ql272Density){
    if(profile.density===density)return;
    onChange(ql291QuickDensity(preferences,density));
    setFeedback(`${density==='compact'?'Compact':'Comfortable'} presentation selected for ${profile.label}. Permissions are unchanged; ${storageAvailable?'saving uses the existing local layout record.':'browser persistence may be unavailable.'}`);
  }
  function recheck(){
    const result=ql291Recovery(inspectQl272LocalLayout());
    setRecovery(result);
    setFeedback(`Local layout check: ${result.audit.title}. No remote read or role change.`);
  }
  function restore(){
    const result=ql291Recovery(inspectQl272LocalLayout());
    setRecovery(result);
    if(!result.preferences){
      setFeedback('Restore stopped: no valid saved layout. Use safe defaults only if the local record is invalid or malformed.');
      return;
    }
    onRestore(result.preferences);
    setFeedback(`Restored locally verified “${result.audit.activeLabel??'Standard'}” layout. Display role only; no authorization changed.`);
  }
  function resetInvalid(){
    const result=ql291Recovery(inspectQl272LocalLayout());
    setRecovery(result);
    if(result.audit.status!=='invalid'&&result.audit.status!=='malformed'){
      setFeedback('Safe reset is for an invalid or malformed saved record; no changes made.');return;
    }
    onReset(defaultQl272Preferences());
    setRecovery(ql291Recovery(inspectQl272LocalLayout()));
    setFeedback('Invalid local layout replaced with safe Standard defaults where browser storage permits.');
  }

  return <section className="ql291-board" aria-labelledby="ql291-board-title" data-ql291-board>
    <div className="ql291-board-head">
      <div><p className="ql271-eyebrow">QL-291 · Guided operator navigation</p>
        <h3 id="ql291-board-title">At a glance <span>· {role.label} display preview</span></h3>
        <p>Get where we need to go, see why each panel matters, and recover the layout safely. This is a screen preference, not a signed-in role.</p></div>
      <div className="ql291-board-head-actions"><span className="ql291-readonly">READ-ONLY / SYNTHETIC</span>
        <button type="button" aria-expanded={open} aria-controls="ql291-guided-cards" onClick={()=>setOpen(value=>!value)}>{open?'Collapse guide':'Show guided cards'}</button></div>
    </div>

    <div className="ql291-overview" aria-label="Current command summary from known or fictional data">
      {QL291_OVERVIEW[mode].map(item=><div key={item.label}><small>{item.label}</small><strong>{item.value}</strong><span>{item.context}</span></div>)}
    </div>

    {open&&<div id="ql291-guided-cards" className="ql291-card-grid" aria-label="Three guided routes for this command view">
      {routes.map(route=><article key={route.id} className="ql291-route" aria-labelledby={`ql291-${mode}-${route.id}`}>
        <span className="ql291-step">{route.label}</span>
        <h4 id={`ql291-${mode}-${route.id}`}>{route.title}</h4>
        <p>{route.description}</p>
        <div className="ql291-route-actions"><button type="button" onClick={()=>onNavigate(route.target)}>Open preview <span aria-hidden="true">›</span></button>
          <button type="button" className="ql291-help" aria-label={`Help about ${route.title}`} aria-expanded={helpId===route.id} aria-controls={`ql291-help-${mode}-${route.id}`}
            onClick={()=>setHelpId(current=>current===route.id?null:route.id)}>ⓘ Help</button></div>
        {helpId===route.id&&<p id={`ql291-help-${mode}-${route.id}`} className="ql291-help-detail" role="note">{route.help}</p>}
      </article>)}
    </div>}

    <div className="ql291-preferences">
      <div className="ql291-preference-copy"><strong>Command layout · {profile.label}</strong>
        <span>{role.scope}. {safety.canAccessTenant||safety.canIssueGatewayGet||safety.canSend?'Restricted action unavailable.':'No real tenant, gateway or messaging permission.'}</span>
        <small>{saved?'Saved through the existing QL-272 local layout format.':storageAvailable?'No verified local layout yet; Standard defaults are active.':'Storage unavailable — this layout is session-only.'}</small></div>
      <div className="ql291-preference-controls" role="group" aria-label="Quick command screen density">
        <button type="button" aria-pressed={profile.density==='comfortable'} onClick={()=>changeDensity('comfortable')}>Comfortable</button>
        <button type="button" aria-pressed={profile.density==='compact'} onClick={()=>changeDensity('compact')}>Compact</button>
      </div>
      <div className="ql291-recovery" aria-label="Safe local layout recovery">
        <span>Saved layout: <strong>{recovery.audit.status.toUpperCase()}</strong></span>
        <button type="button" onClick={recheck}>Check saved view</button>
        <button type="button" disabled={recovery.audit.status!=='valid'} onClick={restore}>Restore verified layout</button>
        {(recovery.audit.status==='invalid'||recovery.audit.status==='malformed')&&
          <button type="button" className="ql291-repair" onClick={resetInvalid}>Replace invalid layout with defaults</button>}
      </div>
    </div>
    <p className="ql291-feedback" role="status" aria-live="polite">{feedback}</p>
  </section>;
}
