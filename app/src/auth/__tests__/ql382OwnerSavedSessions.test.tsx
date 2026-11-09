// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OwnerIncidentHistory} from '../OwnerIncidentHistory';
import type {OwnerIncidentHistory as HistoryState} from '../ql377OwnerIncidentHistory';
const NOW=Date.parse('2026-11-08T22:00:00Z');
const snapshotAt=new Date(NOW-10000).toISOString();
const history:HistoryState={role:'master',nextSequence:3,observations:[
  {sequence:1,key:'action',title:'Owner review needed',category:'security',severity:'action',detail:'Check',nextStep:'Review',firstSeenMs:NOW-20000,lastSeenMs:NOW-10000,noLongerShownMs:null,snapshotAt},
  {sequence:2,key:'info',title:'Earlier connection alert',category:'connection',severity:'information',detail:'Earlier',nextStep:'Verify',firstSeenMs:NOW-60000,lastSeenMs:NOW-30000,noLongerShownMs:NOW-10000,snapshotAt}
]};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const show=async(authenticated=true)=>act(async()=>root.render(<OwnerIncidentHistory history={history} nowMs={NOW} authenticated={authenticated}/>));
const click=async(label:string)=>{
  const node=[...host.querySelectorAll<HTMLButtonElement>('button')].find(item=>item.textContent===label);
  expect(node,`Missing ${label}`).toBeTruthy();await act(async()=>node!.click());
};
describe('QL-382 session review snapshots and progress',()=>{
  it('saves and restores bounded filter views without persisting incident content',async()=>{
    await show();
    const filter=host.querySelector<HTMLSelectElement>('#ql377-filter')!;
    await act(async()=>{filter.value='ended';filter.dispatchEvent(new Event('change',{bubbles:true}));});
    await click('Save current session view');
    expect(host.textContent).toContain('1 of 5 in-memory saved views');
    await click('Action needed');
    expect(filter.value).toBe('showing');
    await click('View 1');
    expect(filter.value).toBe('ended');
    await show(false);
    expect(host.textContent).toContain('0 of 5 in-memory saved views');
    expect(host.textContent).toContain('0 of 0 observed alert episodes opened for review');
  });
  it('counts explicit opened observations, not resolution or source confirmation',async()=>{
    await show();
    expect(host.querySelector('progress')?.value).toBe(0);
    await act(async()=>host.querySelector<HTMLButtonElement>('.ql377-item')!.click());
    expect(host.querySelector('progress')?.value).toBe(1);
    expect(host.textContent).toContain('1 of 2 observed alert episodes opened for review (50%)');
    expect(host.textContent).toContain('No messages sent, approvals granted, or incident status changed');
    await click('Save current session view');
    await click('Clear saved views');
    expect(host.textContent).toContain('0 of 5 in-memory saved views');
  });
  it('caps retained view snapshots at five',async()=>{
    await show();
    for(let i=0;i<7;i++)await click('Save current session view');
    expect(host.querySelectorAll('.ql382-review-sessions button[aria-label^="Restore saved view"]')).toHaveLength(5);
  });
});
