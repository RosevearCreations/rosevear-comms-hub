// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OwnerIncidentHistory} from '../OwnerIncidentHistory';
import type {OwnerIncidentHistory as HistoryState} from '../ql377OwnerIncidentHistory';
const now=Date.parse('2026-11-08T22:00:00Z');
const snapshotAt=new Date(now-10000).toISOString();
const history:HistoryState={role:'master',nextSequence:3,observations:[
  {sequence:1,key:'action',title:'Action alert',category:'security',severity:'action',detail:'Check',nextStep:'Review',firstSeenMs:now-20000,lastSeenMs:now-10000,noLongerShownMs:null,snapshotAt},
  {sequence:2,key:'info',title:'Earlier alert',category:'connection',severity:'information',detail:'Earlier',nextStep:'Verify',firstSeenMs:now-60000,lastSeenMs:now-30000,noLongerShownMs:now-10000,snapshotAt}
]};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const render=async(authenticated=true)=>act(async()=>root.render(<OwnerIncidentHistory history={history} nowMs={now} authenticated={authenticated}/>));
const click=async(text:string)=>{const button=[...host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.startsWith(text));expect(button).toBeDefined();await act(async()=>button!.click());};
describe('QL-384 bounded handoff history and evidence boundaries',()=>{
  it('tracks outstanding episodes independent of visible filters and records read-only handoff counts',async()=>{
    await render();
    expect(host.textContent).toContain('Outstanding review work: 2 of 2 observed episodes');
    await click('Open next unreviewed alert');
    expect(host.textContent).toContain('Outstanding review work: 1 of 2 observed episodes');
    await click('Action needed');
    expect(host.textContent).toContain('Outstanding review work: 1 of 2 observed episodes');
    await click('Close local review');
    expect(host.textContent).toContain('Handoff 1: 1 of 2 episodes opened; 1 not opened');
    expect(host.textContent).toContain('No cross-session evidence, incident audit record or independently verified resolution is created');
    await click('Start a new local review');
    expect(host.textContent).toContain('Outstanding review work: 2 of 2 observed episodes');
    expect(host.querySelectorAll('.ql384-history li')).toHaveLength(1);
  });
  it('bounds retained closeouts and clears them on owner authentication loss',async()=>{
    await render();
    for(let i=0;i<7;i++){await click('Close local review');await click('Start a new local review');}
    expect(host.querySelectorAll('.ql384-history li')).toHaveLength(5);
    await render(false);
    expect(host.querySelectorAll('.ql384-history li')).toHaveLength(0);
    expect(host.textContent).toContain('No local handoffs recorded in this session');
  });
});
