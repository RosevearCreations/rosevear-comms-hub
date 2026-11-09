// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OwnerIncidentHistory} from '../OwnerIncidentHistory';
import type {OwnerIncidentHistory as HistoryState} from '../ql377OwnerIncidentHistory';
const now=Date.parse('2026-11-08T22:00:00Z');
const snapshotAt=new Date(now-10000).toISOString();
const history:HistoryState={role:'master',nextSequence:3,observations:[
  {sequence:1,key:'info',title:'Private incident title',category:'connection',severity:'information',detail:'Secret-looking detail',nextStep:'Verify',firstSeenMs:now-60000,lastSeenMs:now-30000,noLongerShownMs:now-10000,snapshotAt},
  {sequence:2,key:'action',title:'Action alert',category:'security',severity:'action',detail:'Check',nextStep:'Review',firstSeenMs:now-20000,lastSeenMs:now-10000,noLongerShownMs:null,snapshotAt}
]};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const render=async(authenticated=true)=>act(async()=>root.render(<OwnerIncidentHistory history={history} nowMs={now} authenticated={authenticated}/>));
const click=async(text:string)=>{const button=[...host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.startsWith(text));expect(button).toBeDefined();await act(async()=>button!.click());};
describe('QL-385 safe handoff preview and prioritization',()=>{
  it('prioritizes action alert and exposes only summary counts in preview',async()=>{
    await render();
    await click('Open highest-priority unreviewed alert');
    expect(host.querySelector('#ql377-detail-title')?.textContent).toBe('Action alert');
    expect(host.textContent).toContain('1 of 2 observed alert episodes opened for review');
    await click('Preview handoff export');
    const preview=host.querySelector('#ql385-preview pre')?.textContent??'';
    expect(preview).toContain('Observed episodes: 2; opened: 1; not opened: 1');
    expect(preview).toContain('NOT a source incident audit');
    expect(preview).not.toContain('Private incident title');
    expect(preview).not.toContain('Secret-looking detail');
  });
  it('hides preview on closeout and authentication loss',async()=>{
    await render();await click('Preview handoff export');
    expect(host.querySelector('#ql385-preview')).not.toBeNull();
    await click('Close local review');
    expect(host.querySelector('#ql385-preview')).toBeNull();
    await click('Start a new local review');
    expect(host.querySelector('#ql385-preview')).toBeNull();
    await click('Preview handoff export');await render(false);
    expect(host.querySelector('#ql385-preview')).toBeNull();
  });
});
