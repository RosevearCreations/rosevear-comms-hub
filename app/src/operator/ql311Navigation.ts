import type {OperatorWorkspace} from './ql191Organizations';

export type Ql311SectionId='front_end'|'admin'|'it'|'management'|'statistics'|'status'|'archive';
export interface Ql311Workspace {id:OperatorWorkspace;label:string;description:string}

export const QL311_SECTIONS=[
  {id:'front_end',label:'Front End / Operator',hint:'Inbox, customer work and safe communication drafts',tone:'cyan',ids:['dashboard','inbox','contacts','guided_intake','event_timeline','routing_studio','queue','phone','composer','calendar']},
  {id:'admin',label:'Admin',hint:'Preferences, review guidance and accessible owner preparation',tone:'violet',ids:['accessibility_review','trial','review','intake','samples']},
  {id:'it',label:'I.T. / Connections',hint:'Six-app source plans and nonsecret proof gates',tone:'blue',ids:['it_command','connections','connectors','integration_options','handshake_readiness','connection_testing','six_app_evidence']},
  {id:'management',label:'Management',hint:'Company-scoped oversight and held review decisions',tone:'gold',ids:['management','reports','evidence','audit','handoff']},
  {id:'statistics',label:'Statistical',hint:'Fictional trends, categories and source explanations',tone:'green',ids:['analytics']},
  {id:'status',label:'System Status',hint:'Release checks, safety holds and disabled phone/SMS',tone:'rose',ids:['system_status','telephony']},
  {id:'archive',label:'Advanced / Historical',hint:'Older technical evidence surfaces, retained for reference',tone:'slate',ids:[]}
] as const;

export interface Ql311Section {id:Ql311SectionId;label:string;hint:string;tone:string;items:readonly Ql311Workspace[]}

/** Exactly one section per workspace. The archive keeps every older route reachable. */
export function ql311NavigationSections(workspaces:readonly Ql311Workspace[]):Ql311Section[]{
  const used=new Set<OperatorWorkspace>();
  return QL311_SECTIONS.map(section=>{
    const items=section.id==='archive'
      ?workspaces.filter(item=>!used.has(item.id))
      :section.ids.flatMap(id=>workspaces.filter(item=>item.id===id&&!used.has(item.id)));
    for(const item of items)used.add(item.id);
    return {id:section.id,label:section.label,hint:section.hint,tone:section.tone,items};
  });
}

export function ql311FilteredSections(sections:readonly Ql311Section[],query:string):Ql311Section[]{
  const needle=query.trim().toLocaleLowerCase();
  if(!needle)return [...sections];
  return sections.map(section=>({...section,items:section.items.filter(item=>
    `${item.label} ${item.description} ${section.label}`.toLocaleLowerCase().includes(needle))}))
    .filter(section=>section.items.length>0);
}

export function ql311SectionForWorkspace(sections:readonly Ql311Section[],workspace:OperatorWorkspace){
  return sections.find(section=>section.items.some(item=>item.id===workspace))??sections[0];
}
