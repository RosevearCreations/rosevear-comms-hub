// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OwnerIncidentHistory} from '../OwnerIncidentHistory';
import type {OwnerIncidentHistory as HistoryState} from '../ql377OwnerIncidentHistory';

const NOW=Date.parse('2026-11-08T22:00:00Z');
const snapshotAt=new Date(NOW-10000).toISOString();
const history:HistoryState={role:'master',nextSequence:3,observations:[
  {sequence:1,key:'action',title:'Security review',category:'security',severity:'action',detail:'Check evidence',nextStep:'Review',firstSeenMs:NOW-20000,lastSeenMs:NOW-10000,noLongerShownMs:null,snapshotAt},
  {sequence:2,key:'info',title:'Past connection alert',category:'connection',severity:'information',detail:'Earlier alert',nextStep:'Check source',firstSeenMs:NOW-60000,lastSeenMs:NOW-30000,noLongerShownMs:NOW-10000,snapshotAt}
]};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const show=async(authenticated=true)=>act(async()=>root.render(<OwnerIncidentHistory history={history} nowMs={NOW} authenticated={authenticated}/>));
const key=async(element:Element,value:string)=>act(async()=>element.dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true})));

describe('QL-380 keyboard review and truthful session summaries',()=>{
  it('navigates arrow/Home/End without stealing keyboard focus and Enter opens details',async()=>{
    await show();
    const items=Array.from(host.querySelectorAll<HTMLButtonElement>('.ql377-item'));
    expect(items).toHaveLength(2);
    items[0].focus();
    await key(items[0],'ArrowDown');
    expect(document.activeElement).toBe(items[1]);
    expect(items[1].getAttribute('aria-pressed')).toBe('true');
    await key(items[1],'Home');
    expect(document.activeElement).toBe(items[0]);
    await key(items[0],'End');
    expect(document.activeElement).toBe(items[1]);
    await act(async()=>items[1].dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(document.activeElement).toBe(host.querySelector('#ql377-detail-title'));
  });
  it('summarizes only filtered in-session group observations and clears without authentication',async()=>{
    await show();
    expect(host.querySelector('.ql380-summary')?.textContent).toContain('1 action-level still displayed');
    expect(host.querySelector('.ql380-summary')?.textContent).toContain('1 no longer displayed');
    const urgent=Array.from(host.querySelectorAll('button')).find(button=>button.textContent==='Action needed')!;
    await act(async()=>urgent.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(host.querySelector('.ql380-summary')?.textContent).toContain('0 no longer displayed');
    await show(false);
    expect(host.querySelector('.ql380-summary')?.textContent).toContain('0 still displayed');
    expect(host.textContent).toContain('not independent incident resolutions');
  });
});
