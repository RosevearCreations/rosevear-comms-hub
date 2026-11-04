// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL327_SOURCE_MATRIX} from '../ql327ContractCompatibility';
import {QL329_BOUNDS,QL329_COMMS,QL329_MASTER,QL329_SCENARIOS,QL329_SHELLS,
  QL329_SUPPORT,ql329EvaluatePlan,ql329IntegrityReadback} from '../ql329MasterShellTruth';

describe('QL-329 canonical source truth and master/shell/child security boundaries',()=>{
  it('reconciles the six legacy source identities without granting source access or inventing a master',()=>{
    const result=ql329IntegrityReadback();
    expect(result).toMatchObject({shells:4,supporting:2,uniqueSources:6,
      reconciledLegacySources:true,uniqueDemoChildKeys:4,cases:24,
      allHeld:true,allNoGrant:true,liveConnections:0,
      masterProvisioned:false,masterSessions:0,crossTenantReads:0,physicalDeviceAcceptance:false});
    expect(new Set(QL329_SHELLS.map(x=>x.id))).toEqual(
      new Set(QL327_SOURCE_MATRIX.filter(x=>x.role==='business').map(x=>x.id)));
    expect(new Set(QL329_SUPPORT.map(x=>x.id))).toEqual(
      new Set(QL327_SOURCE_MATRIX.filter(x=>x.role==='support').map(x=>x.id)));
    expect(QL329_MASTER).toMatchObject({provisioned:false,id:'rosevear-master'});
    expect(QL329_COMMS).toMatchObject({role:'communications-service',connection:'DISCONNECTED / HOLD'});
    expect(QL329_BOUNDS).toMatchObject({shells:4,support:2,connected:0,
      privateGets:0,sourceWrites:0,secretReads:0,childTenantGrants:0,windowsRelay:'OFF'});
  });
  it('models YW and iCamp as shells with children, and owned Rosie / Devil as future multiple-child shells',()=>{
    const yard=QL329_SHELLS.find(x=>x.id==='yw')!;
    const camp=QL329_SHELLS.find(x=>x.id==='icamp')!;
    const rosie=QL329_SHELLS.find(x=>x.id==='rosiedazzlers')!;
    const devil=QL329_SHELLS.find(x=>x.id==='devilndove')!;
    expect(yard).toMatchObject({integrationIdentity:'yard-workers',tenantScope:'SHELL_FIRST',ownerChild:'Rosevear Landscaping'});
    expect(camp).toMatchObject({integrationIdentity:'icamp',tenantScope:'SHELL_FIRST',ownerChild:'Camp Rosevear'});
    expect(camp.childPolicy).toBe('MULTIPLE_CAMPGROUNDS_UNDER_SHELL');
    expect(rosie).toMatchObject({ownerChild:'Rosie Dazzlers',tenantScope:'SHELL_FIRST'});
    expect(devil).toMatchObject({ownerChild:'Devil n Dove',tenantScope:'SHELL_FIRST'});
    expect(rosie.shellState).toContain('FUTURE_MULTITENANT');
    expect(devil.shellState).toContain('FUTURE_MULTITENANT');
    for(const row of QL329_SUPPORT)expect(row.tenantKind).toBe('NO_CUSTOMER_TENANT');
  });
  it.each(QL329_SHELLS.map(x=>x.id))('%s permits shell mapping draft only, NEVER connection authorization',sourceId=>{
    const result=ql329EvaluatePlan({masterId:QL329_MASTER.id,sourceId,layer:'master',scenario:'shell_connection'});
    expect(result).toMatchObject({decision:'SHELL_SCOPE_DRAFT_ONLY',resolvedShell:sourceId,
      boundary:'SHELL_NOT_CHILD',connected:false,authorized:false,status:'DISCONNECTED / HOLD',
      credentialReads:0,privateGets:0,writes:0,provisionedTenants:0,ownerApprovals:0,ackSent:false});
    expect(result.childContext).toBeNull();
  });
  it.each(QL329_SHELLS.map(x=>x.id))('%s rejects child as connector even if it is the owned demo child',sourceId=>{
    const shell=QL329_SHELLS.find(x=>x.id===sourceId)!;
    const input={masterId:QL329_MASTER.id,sourceId,layer:'child' as const,
      scenario:'child_as_connector' as const,childFixture:shell.childFixture};
    const result=ql329EvaluatePlan(input);
    expect(result.decision).toBe('DENY_CHILD_AS_CONNECTOR');
    expect(result.authorized).toBe(false);
    const contextual=ql329EvaluatePlan({...input,layer:'master',scenario:'review_child_context'});
    expect(contextual.decision).toBe('CHILD_CONTEXT_REQUIRES_EXPLICIT_GRANT');
    expect(contextual.authorized).toBe(false);
    expect(contextual.childContext).toBe(shell.childFixture);
  });
  it('prevents wrong-shell child aliases, unknown children, and support services from becoming tenants',()=>{
    for(const shell of QL329_SHELLS){
      for(const other of QL329_SHELLS.filter(x=>x.id!==shell.id)){
        expect(ql329EvaluatePlan({masterId:QL329_MASTER.id,sourceId:shell.id,layer:'master',
          scenario:'wrong_shell_child',childFixture:other.childFixture}).decision).toBe('DENY_CROSS_SHELL_CHILD');
      }
      expect(ql329EvaluatePlan({masterId:QL329_MASTER.id,sourceId:shell.id,layer:'shell',
        scenario:'review_child_context',childFixture:'unrecognized-child'}).decision).toBe('DENY_CROSS_SHELL_CHILD');
    }
    for(const support of QL329_SUPPORT){
      const out=ql329EvaluatePlan({masterId:QL329_MASTER.id,sourceId:support.id,
        layer:'master',scenario:'shell_connection'});
      expect(out).toMatchObject({decision:'DENY_SUPPORT_AS_CUSTOMER',resolvedShell:null,
        childContext:null,boundary:'NO_CUSTOMER_TENANT',authorized:false});
    }
    expect(ql329EvaluatePlan({masterId:QL329_MASTER.id,sourceId:'Camp Rosevear',layer:'master',
      scenario:'shell_connection'}).decision).toBe('DENY_UNKNOWN_SOURCE');
    expect(ql329EvaluatePlan({masterId:'fake-master',sourceId:'yw',layer:'master',
      scenario:'shell_connection'}).decision).toBe('DENY_MASTER_IDENTITY');
  });
  it('runs all six draft scenarios across four shells without ever promoting an authorization',()=>{
    expect(QL329_SCENARIOS).toHaveLength(6);
    for(const shell of QL329_SHELLS){
      for(const scenario of QL329_SCENARIOS){
        const input={masterId:QL329_MASTER.id,sourceId:shell.id,
          layer:scenario.id==='child_as_connector'?'child' as const:'master' as const,
          scenario:scenario.id};
        const result=ql329EvaluatePlan(input);
        expect(result).toMatchObject({authorized:false,connected:false,privateGets:0,
          writes:0,status:'DISCONNECTED / HOLD'});
      }
    }
  });
});
let root:Root,host:HTMLDivElement;
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.localStorage.clear();
  host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
describe('QL-329 cross-device and accessible UI regression (emulation, not physical sign-off)',()=>{
  async function view(){
    const button=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(x=>x.textContent?.includes('IT Command'))!;
    await act(async()=>button.click());
    return host.querySelector<HTMLElement>('.ql329')!;
  }
  async function choose(element:string,value:string){
    const select=host.querySelector<HTMLSelectElement>(element)!;
    const setter=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value')!.set!;
    await act(async()=>{setter.call(select,value);select.dispatchEvent(new Event('change',{bubbles:true}));});
  }
  it('renders one master and Comms service with four shells, two supports, and a six-row text table',async()=>{
    const screen=await view();
    expect(screen.getAttribute('data-ql329-release')).toBe('master-shell-child-truth-v2');
    expect(screen.querySelectorAll('.ql329-shell-grid article')).toHaveLength(4);
    expect(screen.querySelectorAll('.ql329-support article')).toHaveLength(2);
    expect(screen.querySelectorAll('.ql329-table-wrap tbody tr')).toHaveLength(6);
    expect(screen.textContent).toContain('Master → application shell → child businesses');
    expect(screen.textContent).toContain('Yard Workers');
    expect(screen.textContent).toContain('Camp Rosevear');
    expect(screen.textContent).toContain('0 / 6 CONNECTED');
    expect(screen.textContent).toContain('NO_CUSTOMER_TENANT');
  });
  it('switches shell and scenario, reveals local context, and never accesses source or storage',async()=>{
    const spy=vi.spyOn(globalThis,'fetch');
    try{
      const screen=await view();
      await choose('#ql329-shell','icamp');
      await choose('#ql329-case','child_as_connector');
      expect(screen.querySelector('.ql329-outcome')?.textContent).toContain('DENY_CHILD_AS_CONNECTOR');
      await choose('#ql329-case','review_child_context');
      expect(screen.querySelector('.ql329-outcome')?.textContent).toContain('CHILD_CONTEXT_REQUIRES_EXPLICIT_GRANT');
      await act(async()=>screen.querySelectorAll<HTMLButtonElement>('.ql329-actions button')[0].click());
      expect(screen.querySelector('#ql329-child-preview')?.textContent).toContain('Camp Rosevear');
      await act(async()=>screen.querySelectorAll<HTMLButtonElement>('.ql329-actions button')[1].click());
      expect(screen.querySelector('#ql329-review')?.textContent).toContain('24');
      await act(async()=>screen.querySelectorAll<HTMLButtonElement>('.ql329-actions button')[2].click());
      expect(screen.querySelector('.ql329-outcome')?.textContent).toContain('SHELL_SCOPE_DRAFT_ONLY');
      expect(spy).not.toHaveBeenCalled();expect(window.localStorage.length).toBe(0);
    }finally{spy.mockRestore();}
  });
  it.each([320,375,768,1024,1440])('at simulated %ipx retains six rows, labelled controls, honest text status and reset',async width=>{
    Object.defineProperty(window,'innerWidth',{configurable:true,value:width});
    const screen=await view();
    await act(async()=>window.dispatchEvent(new Event('resize')));
    expect(screen.querySelectorAll('.ql329-table-wrap tbody tr')).toHaveLength(6);
    expect(screen.querySelectorAll('label select')).toHaveLength(2);
    expect(screen.querySelectorAll('.ql329-actions button')).toHaveLength(3);
    expect(screen.querySelector('.ql329-held')?.textContent).toContain('HOLD');
    expect(screen.querySelectorAll('[aria-expanded]')).toHaveLength(2);
  });
  it('has accessible help/status, colour-independent decisions, documented media breakpoints and no hidden provider calls',()=>{
    const model=readFileSync('src/operator/ql329MasterShellTruth.ts','utf8');
    const ui=readFileSync('src/operator/Ql329MasterShellTruth.tsx','utf8');
    const css=readFileSync('src/operator/ql329-master-shell-truth.css','utf8');
    for(const t of ['aria-labelledby','aria-live','role="note"','<table>','aria-expanded','scope="row"','scope="col"'])expect(ui).toContain(t);
    for(const t of ['min-height:44px',':focus-visible','overflow:auto','max-width:1100px','max-width:768px','max-width:610px','forced-colors:active','prefers-reduced-motion:reduce'])expect(css).toContain(t);
    expect(model+ui).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
    expect(model+ui).not.toContain('import.meta.env');
    expect(model+ui).not.toContain('service_role');
    expect(QL329_BOUNDS.privateGets).toBe(0);
  });
});
