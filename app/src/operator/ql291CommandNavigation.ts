import type {OperatorWorkspace} from './ql191Organizations';
import {operatorOrganizations} from './ql191Organizations';
import {dashboardQueues} from './ql191DashboardData';
import type {Ql271CommandMode} from './Ql271CommandSurfaces';
import {QL270_SOURCES} from './ql270ConnectionCentre';
import {auditQl273SavedView,savedQl273Preferences} from './ql273CommandHelp';
import type {Ql272LocalSnapshot} from '../storage/localRepository';
import {editQl272ActiveProfile,ql272PreviewCapabilities,
  type Ql272Density,type Ql272PreferenceEnvelope,type Ql272RolePreview} from './ql272LayoutPreferences';

type GuidedRoute={id:string;label:string;title:string;description:string;target:OperatorWorkspace;help:string};
// Every target is an existing read-only or synthetic workspace. A role preview
// is presentation only and never changes the destination or permission.
export const QL291_GUIDED_ROUTES:Record<Ql271CommandMode,readonly GuidedRoute[]>={
  it_command:[
    {id:'registry',label:'01 · Source map',title:'Review connection profiles',description:'Six sources, separate business boundaries and held preflight steps.',target:'connections',help:'Shows public source mappings and session-only TEST plan aliases. It cannot provision a connection.'},
    {id:'proof',label:'02 · Evidence',title:'Inspect original proof gaps',description:'Signed Proof-B, reviewer and custodian evidence remain unverified.',target:'six_app_evidence',help:'Read dated, pinned public checks. A 404 is not a live health check, and a 200 would not authenticate a signer.'},
    {id:'gate',label:'03 · Status',title:'Check release safeguards',description:'Separate software deployment status from disabled integrations.',target:'system_status',help:'Operational activation remains blocked regardless of whether the interface build is green.'}
  ],
  management:[
    {id:'work',label:'01 · Workload',title:'Open current business worklist',description:'Rehearse follow-ups within the selected fictional company context.',target:'queue',help:'Only the selected company’s synthetic training queue is displayed; no staff member is assigned.'},
    {id:'inbox',label:'02 · Conversations',title:'Explore the sample inbox',description:'Review brand-scoped fictional messages and triage examples.',target:'inbox',help:'No customer messages are fetched and no real replies can be sent.'},
    {id:'gate',label:'03 · Safeguards',title:'Review management hold status',description:'Confirm that provider dispatch and shared reporting stay disabled.',target:'system_status',help:'Sample workload totals are not live staffing, revenue or customer figures.'}
  ],
  analytics:[
    {id:'reports',label:'01 · Data view',title:'Inspect sample reports',description:'Use fixed fictional events as a demonstration, not business metrics.',target:'reports',help:'Data represents training examples only. Live reporting is not connected.'},
    {id:'business',label:'02 · Context',title:'Compare business workspaces',description:'Understand four isolated company scenarios without merging records.',target:'management',help:'The business overview contains separate example counts rather than a cross-tenant data join.'},
    {id:'gate',label:'03 · Provenance',title:'Read source and release status',description:'Verify why the live analytics feed remains disconnected.',target:'system_status',help:'A source registration count does not imply integration authorization or an active data feed.'}
  ],
  system_status:[
    {id:'registry',label:'01 · Registry',title:'Inspect source identity',description:'Review public GitHub mappings and blocked gateway prerequisites.',target:'connections',help:'No network connection is created by opening the registry.'},
    {id:'proof',label:'02 · Exceptions',title:'Read independent proof exceptions',description:'Check the original signed artifact and witness requirements.',target:'six_app_evidence',help:'A public immutable path check is evidence of that response only, not source-app authentication.'},
    {id:'command',label:'03 · Operations',title:'Return to IT Command',description:'See the six-source overview and guided proof-readback links.',target:'it_command',help:'IT Command uses the same disabled-preview capabilities as every other role view.'}
  ]
};

const examples=Object.values(dashboardQueues).flat();
export const QL291_OVERVIEW:Record<Ql271CommandMode,readonly {label:string;value:string;context:string}[]>={
  it_command:[
    {label:'Known source apps',value:String(QL270_SOURCES.length),context:'4 businesses + 2 supporting'},
    {label:'Signed originals accepted',value:'0',context:'All six integrations on HOLD'},
    {label:'Private gateway trials',value:'0',context:'No TEST-only approval'}
  ],
  management:[
    {label:'Business contexts',value:String(operatorOrganizations.length),context:'Tenant-isolated training views'},
    {label:'Training examples',value:String(examples.length),context:'Fictional, not live workload'},
    {label:'Mock follow-ups',value:String(examples.filter(row=>row.category==='task').length),context:'No real assignments'}
  ],
  analytics:[
    {label:'Sample events',value:String(examples.length),context:'Fictional scenarios'},
    {label:'Category types',value:String(new Set(examples.map(row=>row.category)).size),context:'Counts, not performance'},
    {label:'Live feeds',value:'0',context:'AI Data Platform on HOLD'}
  ],
  system_status:[
    {label:'Registered systems',value:String(QL270_SOURCES.length),context:'Known public mappings'},
    {label:'Verified source approvals',value:'0',context:'Original Proof-B absent'},
    {label:'Runtime activation',value:'OFF',context:'Calls, SMS, gateway GETs held'}
  ]
};

export function ql291QuickDensity(preferences:Ql272PreferenceEnvelope,density:Ql272Density){
  if(density!=='compact'&&density!=='comfortable')return preferences;
  return editQl272ActiveProfile(preferences,profile=>({...profile,density}));
}

export function ql291Recovery(snapshot:Ql272LocalSnapshot){
  const audit=auditQl273SavedView(snapshot);
  return {audit,preferences:savedQl273Preferences(snapshot)};
}

export function ql291PreviewSafety(role:Ql272RolePreview){
  const capabilities=ql272PreviewCapabilities(role);
  return {displayOnly:true,canViewDemo:capabilities.readSyntheticLocalExamples,
    canViewPublicEvidence:capabilities.inspectDatedPublicEvidence,
    canAccessTenant:capabilities.accessRealTenant,
    canIssueGatewayGet:capabilities.issueAuthenticatedGet,
    canSend:capabilities.sendLiveCommunications};
}
