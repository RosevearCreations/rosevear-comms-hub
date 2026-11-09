// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OwnerIncidentHistory} from '../OwnerIncidentHistory';
import type {OwnerIncidentHistory as HistoryState} from '../ql377OwnerIncidentHistory';
const NOW=Date.parse('2026-11-08T22:00:00Z');
const snapshotAt=new Date(NOW-10000).toISOString();
const history:HistoryState={role:'master',nextSequence:3,observations:[
  {sequence:1,key:'action',title:'Owner security review',category:'security',severity:'action',detail:'Check',nextStep:'Review',firstSeenMs:NOW-20000,lastSeenMs:NOW-10000,noLongerShownMs:null,snapshotAt},
  {sequence:2,key:'info',title:'Earlier connection alert',category:'connection',severity:'information',detail:'Earlier',nextStep:'Verify',firstSeenMs:NOW-60000,lastSeenMs:NOW-30000,noLongerShownMs:NOW-10000,snapshotAt}
]};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const show=async(authenticated=true)=>act(async()=>root.render(<OwnerIncidentHistory history={history} nowMs={NOW} authenticated={authenticated}/>));
const click=async(label:string)=>{
  const node=Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(item=>item.textContent===label);
  expect(node,`Missing ${label}`).toBeTruthy();await act(async()=>node!.click());
};
describe('QL-381 session-only bookmarks and review continuity',()=>{
  it('bookmarks only the chosen session observation and safely filters',async()=>{
    await show();
    await click('Bookmark this session alert');
    expect(host.textContent).toContain('Bookmarked only (1 observations)');
    const checkbox=host.querySelector<HTMLInputElement>('#ql381-bookmarked-only')!;
    await act(async()=>checkbox.click());
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(1);
    expect(host.textContent).toContain('Owner security review');
    await click('Remove session bookmark');
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(0);
    await show(false);
    expect(host.textContent).toContain('Bookmarked only (0 observations)');
  });
  it('restores prior filters after a shortcut, without storing owner data',async()=>{
    await show();
    const select=host.querySelector<HTMLSelectElement>('#ql377-filter')!;
    await act(async()=>{select.value='ended';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(1);
    await click('Action needed');
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(1);
    expect(select.value).toBe('showing');
    await click('Restore previous filters');
    expect(select.value).toBe('ended');
    expect(host.textContent).toContain('Earlier connection alert');
  });
  it('returns focus from the detail panel with Escape',async()=>{
    await show();
    const detail=host.querySelector<HTMLElement>('#ql377-detail-title')!;
    detail.focus();
    await act(async()=>detail.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
    expect(document.activeElement).toBe(host.querySelector('.ql377-item'));
  });
});
