import {useState} from 'react';
import './ql462-unified-server-shell.css';
import { Ql464OperatorExperience } from './Ql464OperatorExperience';
import { Ql465PrivacyReadiness } from './Ql465PrivacyReadiness';
import { Ql466CustodyReadiness } from './Ql466CustodyReadiness';
import { Ql467SinkReadiness } from './Ql467SinkReadiness';

type ModuleId = 'ai-data-platform' | 'rosevear-ai-hub' | 'rosevear-comms-hub';
type VisualTheme = 'instrument' | 'nebula' | 'meadow' | 'high-contrast' | 'copper' | 'arctic' | 'solar' | 'graphite';

const modules: ReadonlyArray<{id:ModuleId;label:string;purpose:string}> = [
  {id:'ai-data-platform',label:'Intelligence & Server Shell',
   purpose:'Controller navigation, seven-app provenance and automation oversight'},
  {id:'rosevear-ai-hub',label:'Local AI & Home Automation',
   purpose:'Windows host, Ollama, Home Assistant and MQTT integration planning'},
  {id:'rosevear-comms-hub',label:'Communications & Inbox',
   purpose:'Independent cross-app messaging, event review and operator handoffs'}
];
const themes: ReadonlyArray<{id:VisualTheme;label:string}> = [
  {id:'instrument',label:'Master Instrument'},
  {id:'nebula',label:'Nebula Purple'},
  {id:'meadow',label:'Meadow'},
  {id:'high-contrast',label:'High Contrast'},
  {id:'copper',label:'Copper Workshop'},
  {id:'arctic',label:'Arctic Blue'},
  {id:'solar',label:'Solar Gold'},
  {id:'graphite',label:'Graphite Cyan'}
];

export function Ql462UnifiedServerShell(){
  const [visible,setVisible] = useState<Record<ModuleId,boolean>>({
    'ai-data-platform':true,'rosevear-ai-hub':true,'rosevear-comms-hub':true
  });
  const [theme,setTheme] = useState<VisualTheme>('instrument');
  const [expanded,setExpanded] = useState(true);
  function setModule(id:ModuleId){
    setVisible(current=>({...current,[id]:!current[id]}));
  }
  return <section className="ql462-unified" data-ql462-master-shell="source-only"
    data-ql462-theme={theme} aria-label="Unified three-module Master Server Shell preview">
    <div className="ql462-unified-hero">
      <div>
        <p className="ql462-eyebrow">ROSEVEAR MASTER · SERVER SHELL / DESIGN FOUNDATION</p>
        <h2>One server command centre. Three independent modules.</h2>
        <p>AI Data Platform is the proposed controller. DESKTOP-AE894KC is the intended private 24/7 host. This is a safe, session-only preview—not a running host service or an activation control.</p>
      </div>
      <div className="ql462-hero-status" role="status">
        <span>CONTROL PLANE</span>
        <strong>DESIGN / HOLD</strong>
        <small>Original receiver OPEN · no verified live peers</small>
      </div>
    </div>

    <div className="ql462-toolbar">
      <button type="button" className="ql462-toggle-view" aria-expanded={expanded}
        onClick={()=>setExpanded(!expanded)}>
        {expanded?'Collapse server panel':'Expand server panel'}
      </button>
      <label htmlFor="ql462-visual-theme">Visual theme</label>
      <select id="ql462-visual-theme" value={theme}
        onChange={e=>setTheme(e.target.value as VisualTheme)}
        aria-label="Unified Master preview appearance">
        {themes.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <span className="ql462-preview-caption">Colours and background effects only · no external theme images loaded</span>
    </div>

    {expanded&&<>
      <div className="ql462-module-grid" role="group" aria-label="Master module visibility">
        {modules.map((module,index)=><article key={module.id}
          className="ql462-module" data-module-visible={visible[module.id]?'true':'false'}>
          <p className="ql462-module-index">MODULE 0{index+1}</p>
          <h3>{module.label}</h3>
          <p>{module.purpose}</p>
          <button type="button" aria-pressed={visible[module.id]}
            onClick={()=>setModule(module.id)}>
            {visible[module.id]?'Hide module view':'Show module view'}
          </button>
          <small>{visible[module.id]?'Visible in this dashboard session':'View hidden · service unchanged'}</small>
        </article>)}
      </div>
      <div className="ql462-monitor-grid">
        <article>
          <p className="ql462-eyebrow">SLAVE APPLICATION SHELL</p>
          <h3>Yard Workers</h3>
          <strong className="ql462-monitor-hold">LIVE HEALTH UNVERIFIED</strong>
          <p>Performance, crews, job status and incidents appear here only after independently authenticated source telemetry.</p>
        </article>
        <article>
          <p className="ql462-eyebrow">SLAVE APPLICATION SHELL</p>
          <h3>iCamp</h3>
          <strong className="ql462-monitor-hold">LIVE HEALTH UNVERIFIED</strong>
          <p>Reservations, occupancy, operational alerts and availability require independent iCamp signed source acceptance.</p>
        </article>
        <article>
          <p className="ql462-eyebrow">HOME AUTOMATION</p>
          <h3>Home Assistant · MQTT · Ollama</h3>
          <strong className="ql462-monitor-hold">NOT CONNECTED</strong>
          <p>Planned private integrations on the Windows host; no commands, credentials or device control are enabled by this preview.</p>
        </article>
      </div>
      <Ql464OperatorExperience />
      <Ql465PrivacyReadiness />
      <Ql466CustodyReadiness />
      <Ql467SinkReadiness />
      <p className="ql462-disclaimer" role="status">
        Module visibility and theme selection are browser-session display preferences only.
        They do not start, stop, install or authorize a Windows service. Production integrations and
        always-on hosting require separate owner-approved provisioning, health checks and recovery safeguards.
      </p>
    </>}
  </section>;
}
