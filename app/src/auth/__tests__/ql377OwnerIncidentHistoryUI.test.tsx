// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OwnerIncidentHistory} from '../OwnerIncidentHistory';
import {EMPTY_OWNER_HISTORY,observeOwnerIncidents} from '../ql377OwnerIncidentHistory';

const NOW=Date.parse('2026-11-08T20:00:00Z');
const snapshotAt=new Date(NOW-3000).toISOString();
const current=observeOwnerIncidents(EMPTY_OWNER_HISTORY,{role:'source',aal2:true,nowMs:NOW,
  freshness:{kind:'current',label:'Recent',ageSeconds:3,observedAt:snapshotAt},
  incidents:[{id:'connections-held',category:'connection',severity:'information',title:'Six shells held',
    detail:'Not six independent source checks',nextStep:'Review read-only status'},
  {id:'freshness-review',category:'freshness',severity:'warning',title:'Status expiring',
    detail:'Readback expiry approaching',nextStep:'Refresh protected status'}]});
const history=observeOwnerIncidents(current,{role:'source',aal2:true,nowMs:NOW+15000,
  freshness:{kind:'current',label:'Recent',ageSeconds:18,observedAt:snapshotAt},
  incidents:[{id:'connections-held',category:'connection',severity:'information',title:'Six shells held',
    detail:'Not six independent source checks',nextStep:'Review read-only status'}]});
let host:HTMLDivElement,root:Root;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const render=async(authenticated=true)=>act(async()=>root.render(<OwnerIncidentHistory
  history={history} nowMs={NOW+15000} authenticated={authenticated}/>));

describe('QL-377 accessible history with safe guidance',()=>{
  it('distinguishes no-longer-displayed from resolved, filters and moves keyboard focus',async()=>{
    await render();
    expect(host.textContent).toContain('not server incident history');
    const select=host.querySelector<HTMLSelectElement>('#ql377-filter')!;
    expect(select).toBeTruthy();
    await act(async()=>{select.value='ended';select.dispatchEvent(new Event('change',{bubbles:true}));});
    const buttons=host.querySelectorAll<HTMLButtonElement>('.ql377-item');
    expect(buttons).toHaveLength(1);
    expect(host.textContent).toContain('No longer showing; not independently resolved');
    await act(async()=>buttons[0].dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(document.activeElement).toBe(host.querySelector('#ql377-detail-title'));
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('a')?.getAttribute('href')).toBe('#ql370-refresh-status');
    // QL-378 adds a local-only search box and grouping checkbox; no form or
    // network-capable submission is introduced.
    expect(host.querySelectorAll('form,textarea')).toHaveLength(0);
    expect(Array.from(host.querySelectorAll('input')).map(node=>node.type)).toEqual(['search','checkbox']);
  });
  it('does not reveal prior observations when the personal MFA session is absent',async()=>{
    await render(false);
    expect(host.querySelectorAll('.ql377-item')).toHaveLength(0);
    expect(host.textContent).toContain('0 of 0 session observations');
  });
});
