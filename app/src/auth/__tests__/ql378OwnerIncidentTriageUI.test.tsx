// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OwnerIncidentHistory} from '../OwnerIncidentHistory';
import type {OwnerIncidentHistory as HistoryState} from '../ql377OwnerIncidentHistory';

const NOW=Date.parse('2026-11-08T22:00:00Z');
const snapshotAt=new Date(NOW-10000).toISOString();
const history:HistoryState={role:'source',nextSequence:4,observations:[
  {sequence:1,key:'held:information:Held',title:'Six shells held',category:'connection',severity:'information',
    detail:'Aggregated HOLD only',nextStep:'Review protected evidence',firstSeenMs:NOW-90000,
    lastSeenMs:NOW-85000,noLongerShownMs:NOW-60000,snapshotAt},
  {sequence:2,key:'held:information:Held',title:'Six shells held',category:'connection',severity:'information',
    detail:'Aggregated HOLD only',nextStep:'Review protected evidence',firstSeenMs:NOW-30000,
    lastSeenMs:NOW-10000,noLongerShownMs:null,snapshotAt},
  {sequence:3,key:'security-stop:action:STOP',title:'Owner evidence STOP',category:'security',severity:'action',
    detail:'Audit discrepancy',nextStep:'Review signing evidence',firstSeenMs:NOW-20000,
    lastSeenMs:NOW-10000,noLongerShownMs:null,snapshotAt}
]};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const show=async(authenticated=true)=>act(async()=>root.render(<OwnerIncidentHistory
  history={history} nowMs={NOW} authenticated={authenticated}/>));
const changeInput=async(input:HTMLInputElement,value:string)=>act(async()=>{
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);
  input.dispatchEvent(new Event('input',{bubbles:true}));
});

describe('QL-378 accessible grouped triage',()=>{
  it('groups repeated observations with complete episode detail and live counts',async()=>{
    await show();
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(2);
    expect(host.textContent).toContain('3 of 3 session observations');
    expect(host.textContent).toContain('2 distinct session observations');
    const held=Array.from(host.querySelectorAll<HTMLButtonElement>('.ql377-item'))
      .find(node=>node.textContent?.includes('Six shells held'))!;
    await act(async()=>held.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(document.activeElement).toBe(host.querySelector('#ql377-detail-title'));
    expect(host.querySelectorAll('.ql378-episodes li')).toHaveLength(2);
    expect(host.textContent).toContain('not independently resolved');
    expect(host.textContent).toContain('not independently source-verified');
  });
  it('filters by a safe text query and supports clearing with no remote actions',async()=>{
    await show();
    const input=host.querySelector<HTMLInputElement>('#ql378-search')!;
    await changeInput(input,'signing evidence');
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(1);
    expect(host.textContent).toContain('Owner evidence STOP');
    const clear=Array.from(host.querySelectorAll<HTMLButtonElement>('button'))
      .find(button=>button.textContent==='Clear search')!;
    await act(async()=>clear.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(2);
    expect(host.querySelector('a')?.getAttribute('href')).toBe('#ql370-refresh-status');
    expect(host.querySelectorAll('form,textarea')).toHaveLength(0);
  });
  it('hides owner observations and any earlier query when authentication is lost',async()=>{
    await show();
    await changeInput(host.querySelector<HTMLInputElement>('#ql378-search')!,'signing');
    await show(false);
    expect(host.querySelector<HTMLInputElement>('#ql378-search')?.value).toBe('');
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(0);
    expect(host.textContent).toContain('0 of 0 session observations');
  });
});
