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
describe('QL-383 owner review continuity',()=>{
  it('navigates to unreviewed episodes, retaining progress across filters',async()=>{
    await render();
    await click('Open next unreviewed alert');
    expect(host.textContent).toContain('1 of 2 observed alert episodes opened for review');
    await click('Action needed');
    expect(host.textContent).toContain('1 of 2 observed alert episodes opened for review');
    await click('All alerts');
    await click('Open next unreviewed alert');
    expect(host.textContent).toContain('2 of 2 observed alert episodes opened for review');
    expect(host.querySelector<HTMLButtonElement>('.ql383-actions button')?.disabled).toBe(true);
  });
  it('closes only the local review and clears its session notes',async()=>{
    await render();await click('Open next unreviewed alert');await click('Save current session view');
    await click('Close local review');
    expect(host.textContent).toContain('Local review closed');
    expect(host.textContent).toContain('does not close, resolve, approve or notify any source incident');
    await click('Start a new local review');
    expect(host.textContent).toContain('0 of 2 observed alert episodes opened for review');
    expect(host.textContent).toContain('0 of 5 in-memory saved views');
    await render(false);
    expect(host.textContent).toContain('0 of 0 observed alert episodes opened for review');
  });
});
