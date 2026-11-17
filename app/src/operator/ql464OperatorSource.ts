/** QL-464 cannot infer live application connectivity from a browser or a GitHub deploy. */
export const ql464Sources = [
  {id:'ai-data-platform',name:'AI Data Platform',role:'Master · server/controller'},
  {id:'rosevear-ai-hub',name:'Rosevear AI Hub',role:'Master · original Windows host'},
  {id:'rosevear-comms-hub',name:'Rosevear Comms Hub',role:'Master · communications'},
  {id:'icamp',name:'iCamp',role:'Slave · campground SaaS'},
  {id:'yw',name:'Yard Workers',role:'Slave · landscaping SaaS'},
  {id:'devilndove',name:'Devil n Dove',role:'Internal shop'},
  {id:'rosiedazzlers',name:'Rosie Dazzlers',role:'Internal detailing'}
] as const;
export type Ql464SourceId = typeof ql464Sources[number]['id'];
/** No cryptographically verified server adapter exists in QL-464. Always fail closed. */
export const ql464SourceStatus = (_source: Ql464SourceId): 'UNVERIFIED' => 'UNVERIFIED';
export const ql464SampleTasks: readonly {id:string;source:Ql464SourceId;title:string;action:string}[] = [
  {id:'icamp-health',source:'icamp',title:'Check iCamp source-health evidence',
    action:'Obtain source-signed, independently checked read-only health before any connectivity claim.'},
  {id:'host-custody',source:'rosevear-ai-hub',title:'Review original Windows host custody',
    action:'Keep installation, receiver and Windows service actions behind an independent owner ceremony.'},
  {id:'accessibility',source:'rosevear-comms-hub',title:'Record operator accessibility observations',
    action:'Test desktop, tablet and mobile keyboard, focus, contrast, zoom and screen reader.'}
];
export const ql464EvidenceTimeline = [
  {id:'peer',title:'Seven-app source evidence',state:'AWAITING',detail:'No independently accepted live-health receipts were supplied.'},
  {id:'incident',title:'Incident / ACK event feed',state:'AWAITING',detail:'No authenticated incident stream; no incidents or timestamps invented.'},
  {id:'windows',title:'Original-host control',state:'HOLD',detail:'Live Windows supervisor and receiver remain separately owner-gated.'},
  {id:'cx',title:'Operator accessibility acceptance',state:'HOLD',detail:'Requires actual owner-observed device and screen-reader tests.'}
] as const;
export function ql464TaskMatches(task: typeof ql464SampleTasks[number], query: string, appId: Ql464SourceId | 'all'): boolean {
  if (appId !== 'all' && task.source !== appId) return false;
  const source = ql464Sources.find((s)=>s.id===task.source);
  return [task.title,task.action,source?.name||''].join(' ').toLowerCase().includes(query.trim().toLowerCase());
}
