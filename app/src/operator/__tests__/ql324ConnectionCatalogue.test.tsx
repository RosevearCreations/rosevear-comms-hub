// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL324_BOUNDARY,QL324_CATALOGUE,ql324CheckSyntheticScope,ql324FilteredCatalogue} from '../ql324ConnectionCatalogue';
import {QL308_TENANT_FIXTURES} from '../ql308TenantContracts';

describe('QL-324 catalogue / trust boundary contract',()=>{
  it('maps exactly four distinct business tenants and two non-tenant support services from the signed-off registry',()=>{
    expect(QL324_CATALOGUE).toHaveLength(6);
    expect(QL324_BOUNDARY).toMatchObject({businesses:4,supporting:2,connected:0,requests:0,customerRecords:0,approvedGates:0});
    expect(new Set(QL324_CATALOGUE.map(row=>row.id)).size).toBe(6);
    expect(new Set(QL324_CATALOGUE.map(row=>row.fixtureAlias).filter(Boolean)).size).toBe(4);
    for(const row of QL324_CATALOGUE){
      expect(row.connection).toBe('DISCONNECTED / HOLD');
      expect(row.capability).toBe('REGISTRY ONLY · NOT VERIFIED');
      expect(row.permission).toContain('DENIED');
      expect(row.blockers).toHaveLength(5);
      expect(row.customerRecordsExposed).toBe(0);
      expect(row.allowedReadPaths).toEqual(['/api/integration/v1/health','/api/integration/v1/capabilities']);
      expect(row.publicRepository).toBe(`https://github.com/RosevearCreations/${row.repo}`);
      expect(row.deployment).toContain('NOT VERIFIED');
      if(row.category==='support')expect(row.fixtureAlias).toBeNull();
      else expect(row.fixtureAlias).toMatch(/^np-/);
    }
  });
  it('filters source roles using the same model as cards, topology and table',()=>{
    expect(ql324FilteredCatalogue('all')).toEqual(QL324_CATALOGUE);
    expect(ql324FilteredCatalogue('business')).toHaveLength(4);
    expect(ql324FilteredCatalogue('support')).toHaveLength(2);
    expect(ql324FilteredCatalogue('all','  iCAMP  ').map(row=>row.id)).toEqual(['icamp']);
    expect(ql324FilteredCatalogue('support','rosevear')).toHaveLength(1);
    expect(ql324FilteredCatalogue('all','not-in-registry')).toHaveLength(0);
  });
  it('fails closed on other businesses, production aliases, support-as-tenant, and unknown sources',()=>{
    for(const fixture of QL308_TENANT_FIXTURES){
      const expected=ql324CheckSyntheticScope(fixture.source,fixture.alias);
      expect(expected).toMatchObject({decision:'MATCHED_SYNTHETIC_SCOPE_NOT_AUTHORIZED',authorized:false,customerRecords:0,gatewayRequests:0,connection:'DISCONNECTED / HOLD'});
      for(const another of QL308_TENANT_FIXTURES.filter(row=>row.source!==fixture.source)){
        expect(ql324CheckSyntheticScope(fixture.source,another.alias).decision).toBe('DENY_CROSS_BUSINESS');
      }
      expect(ql324CheckSyntheticScope(fixture.source,'production').decision).toBe('DENY_INVALID_ALIAS');
    }
    expect(ql324CheckSyntheticScope('ai-data-platform','np-rosie-demo').decision).toBe('DENY_SUPPORT_IS_NOT_TENANT');
    expect(ql324CheckSyntheticScope('rosevear-ai-hub','np-yard-demo').decision).toBe('DENY_SUPPORT_IS_NOT_TENANT');
    expect(ql324CheckSyntheticScope('__proto__','np-rosie-demo').decision).toBe('DENY_UNKNOWN_SOURCE');
  });
});

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});window.localStorage.clear();host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
function nav(label:string){const found=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(row=>row.textContent?.includes(label));if(!found)throw Error(`Nav missing: ${label}`);return found;}

describe('QL-324 connection studio',()=>{
  it('shows six source cards with exact diagram/table parity and historical, unverified evidence',async()=>{
    await act(async()=>nav('IT Command').click());
    const view=host.querySelector('.ql324')!;
    expect(view.getAttribute('data-ql324-release')).toBe('six-app-blueprint-no-connection-v1');
    expect(view.querySelectorAll('.ql324-card')).toHaveLength(6);
    expect(view.querySelectorAll('.ql324-flow-node')).toHaveLength(6);
    expect(view.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(view.textContent).toContain('4 / 4');
    expect(view.textContent).toContain('2 / 2');
    expect(view.textContent).toContain('0 / 6 CONNECTED');
    expect(view.textContent).toContain('NOT VERIFIED');
    expect(view.textContent).toContain('NO AUTHORIZED SOURCE GET');
    expect(view.querySelectorAll('a[href^="https://github.com/RosevearCreations/"]')).toHaveLength(6);
    expect(host.querySelector('.ql303')).not.toBeNull();
  });
  it('keeps details company-scoped and denies cross-business synthetic tenant checks',async()=>{
    await act(async()=>nav('IT Command').click());
    const view=host.querySelector('.ql324')!;
    const icamp=[...view.querySelectorAll<HTMLButtonElement>('.ql324-card')].find(row=>row.textContent?.includes('iCamp'))!;
    await act(async()=>icamp.click());
    expect(view.querySelector('#ql324-detail-title')?.textContent).toContain('iCamp');
    expect(view.querySelector('.ql324-scope-outcome')?.textContent).toContain('MATCHED_SYNTHETIC_SCOPE_NOT_AUTHORIZED');
    const scope=view.querySelector<HTMLSelectElement>('#ql324-scope-select')!;
    await act(async()=>{scope.value='other';scope.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(view.querySelector('.ql324-scope-outcome')?.textContent).toContain('DENY_CROSS_BUSINESS');
    expect(view.querySelector('.ql324-scope-outcome')?.textContent).toContain('Customer records: 0');
    const support=[...view.querySelectorAll<HTMLButtonElement>('.ql324-card')].find(row=>row.textContent?.includes('AI Data Platform'))!;
    await act(async()=>support.click());
    expect(view.querySelector('.ql324-scope-outcome')?.textContent).toContain('DENY_SUPPORT_IS_NOT_TENANT');
    expect(view.querySelector('#ql324-detail-title')?.textContent).toContain('AI Data Platform');
    expect(window.localStorage.length).toBe(0);
  });
  it('filters support roles without producing a fifth or sixth tenant, then restores all six',async()=>{
    await act(async()=>nav('IT Command').click());
    const view=host.querySelector('.ql324')!;
    const filter=view.querySelector<HTMLSelectElement>('#ql324-category')!;
    await act(async()=>{filter.value='support';filter.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(view.querySelectorAll('.ql324-card')).toHaveLength(2);
    expect(view.querySelectorAll('.ql324-flow-node')).toHaveLength(2);
    expect(view.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(view.textContent).toContain('No customer tenant alias exists');
    const reset=[...view.querySelectorAll<HTMLButtonElement>('button')].find(button=>button.textContent?.includes('Reset catalogue'))!;
    await act(async()=>reset.click());
    expect(view.querySelectorAll('.ql324-card')).toHaveLength(6);
    expect(view.querySelectorAll('.ql324-flow-node')).toHaveLength(6);
    expect(view.querySelectorAll('tbody tr')).toHaveLength(6);
  });
  it('includes touch targets, keyboard focus, contrast and reduced-motion support; no fetch or mutations',()=>{
    const css=readFileSync('src/operator/ql324-connection-catalogue.css','utf8');
    const ui=readFileSync('src/operator/Ql324ConnectionCatalogue.tsx','utf8');
    const model=readFileSync('src/operator/ql324ConnectionCatalogue.ts','utf8');
    for(const needle of ['min-height:44px',':focus-visible','overflow-x:auto','max-width:580px','forced-colors:active','prefers-reduced-motion:reduce'])expect(css).toContain(needle);
    for(const needle of ['role="status"','aria-live="polite"','<table>','aria-pressed'])expect(ui).toContain(needle);
    expect(ui+model).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
  });
});
