// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL327_SOURCE_MATRIX} from '../ql327ContractCompatibility';
import {QL328_BOUNDARY,QL328_PHASES,QL328_SCENARIOS,ql328FailureMatrix,
  ql328Orchestrate,ql328RetryLocally} from '../ql328DryRunOrchestrator';

describe('QL-328 local-only, fail-closed orchestration',()=>{
  it('keeps all six source/tenant roles isolated and every actual operation at zero',()=>{
    const summary=ql328FailureMatrix();
    expect(summary).toMatchObject({cases:102,sourceCount:6,failureSignals:17,noGo:102,allUnsent:true,
      allHeld:true,uniqueKeys:102,businessCount:4,supportCount:2});
    expect(QL328_PHASES.map(x=>x.id)).toEqual(['proof','authority','scope','contract','plan','fallback']);
    expect(QL328_BOUNDARY).toMatchObject({sources:6,businesses:4,support:2,
      privateGETs:0,connected:0,sourceWrites:0,credentialsRead:0,sentPackets:0,
      realRetries:0,realRollbacks:0,windowsRelay:'OFF'});
    for(const row of QL327_SOURCE_MATRIX){
      expect(row.status).toBe('DISCONNECTED / HOLD');
      if(row.role==='support')expect(row.fixtureAlias).toBeNull();
      else expect(row.fixtureAlias).toMatch(/^np-/);
    }
  });
  it.each(QL327_SOURCE_MATRIX.map(x=>x.id))('all 17 signals for %s deterministically yield UNSENT NO-GO',sourceId=>{
    const row=QL327_SOURCE_MATRIX.find(x=>x.id===sourceId)!;
    for(const scenario of QL328_SCENARIOS){
      const request={sourceId,scenario:scenario.id,tenantAlias:row.fixtureAlias};
      const first=ql328Orchestrate(request);
      const again=ql328Orchestrate(request);
      expect(first).toEqual(again);
      expect(first.packet).toMatchObject({source:sourceId,reason:scenario.reason,stopPhase:scenario.phase,
        disposition:'NO_GO',delivery:'UNSENT',connection:'DISCONNECTED / HOLD',signed:false,
        stored:false,mayRetryAutomatically:false,maySend:false,sourceRequests:0,sourceWrites:0,
        originalProof:'NOT_VERIFIED',ownerTestApproval:'NOT_GRANTED',ackSent:false});
      expect(first).toMatchObject({allHeld:true,networkRequests:0,providerWrites:0,
        customerRecords:0,credentialsRead:0,rollbackRemote:false,replaySent:false});
      expect(first.phases).toHaveLength(6);
      expect(first.phases.find(x=>x.id===scenario.phase)?.status).toBe('SIMULATED_STOP');
      expect(first.packet.rollbackSteps).toHaveLength(3);
      expect(first.packet.rollbackSteps[0]).toContain('local');
      expect(ql328RetryLocally({...request,attempt:3}).packet).toEqual(first.packet);
    }
  });
  it('rejects unknown source and cross-tenant inputs without leaking identities or performing a fallback',()=>{
    const unknown=ql328Orchestrate({sourceId:'other',scenario:'baseline'});
    expect(unknown.packet).toMatchObject({reason:'UNKNOWN_SOURCE',role:'unknown',tenantAlias:null,
      disposition:'NO_GO',delivery:'UNSENT'});
    const cross=ql328Orchestrate({sourceId:'rosiedazzlers',scenario:'baseline',tenantAlias:'np-devil-demo'});
    expect(cross.packet).toMatchObject({reason:'TENANT_BOUNDARY',stopPhase:'scope'});
    const support=ql328Orchestrate({sourceId:'ai-data-platform',scenario:'baseline',tenantAlias:'np-rosie-demo'});
    expect(support.packet.reason).toBe('TENANT_BOUNDARY');
    const valid=ql328Orchestrate({sourceId:'ai-data-platform',scenario:'baseline',tenantAlias:null});
    expect(valid.packet.tenantAlias).toBeNull();
    expect(valid.packet.disposition).toBe('NO_GO');
  });
  it('handles offline, replay, cancellation and retry idempotently with immutable packet identity',()=>{
    for(const scenario of ['offline','replay','cancel','timeout','http_429'] as const){
      const request={sourceId:'icamp',scenario,attempt:1};
      const a=ql328RetryLocally(request),b=ql328RetryLocally({...request,attempt:2});
      expect(a.packet).toEqual(b.packet);
      expect(b.attempt).toBe(2);
      expect(a.packet.maySend).toBe(false);
    }
    const cancelled=ql328Orchestrate({sourceId:'yw',scenario:'cancel'});
    expect(cancelled.packet).toMatchObject({reason:'CANCELLED_LOCALLY',delivery:'UNSENT'});
  });
});

let host:HTMLDivElement,root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.localStorage.clear();host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

describe('QL-328 I.T. Command accessible dry-run UI',()=>{
  async function open(){const nav=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(b=>b.textContent?.includes('IT Command'))!;
    await act(async()=>nav.click());return host.querySelector<HTMLElement>('.ql328')!;}
  async function choose(selector:string,value:string){
    const el=host.querySelector<HTMLSelectElement>(selector)!;
    const setter=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value')!.set!;
    await act(async()=>{setter.call(el,value);el.dispatchEvent(new Event('change',{bubbles:true}));});
  }
  it('renders six phases, 17 case descriptions, honest NO-GO and nonproduction hold readback',async()=>{
    const view=await open();
    expect(view.getAttribute('data-ql328-release')).toBe('local-only-no-go-orchestrator-v1');
    expect(view.querySelectorAll('.ql328-phases li')).toHaveLength(6);
    expect(view.querySelectorAll('.ql328-table-wrap tbody tr')).toHaveLength(17);
    expect(view.textContent).toContain('102');
    expect(view.textContent).toContain('UNSENT NO-GO');
    expect(view.textContent).toContain('DISCONNECTED');
    expect(view.textContent).toContain('ACK UNDER_REVIEW');
  });
  it('rehearses a mock failure, repeated packet and cancellation without fetch or storage',async()=>{
    const spy=vi.spyOn(globalThis,'fetch');
    try{
      const view=await open();
      await choose('#ql328-source','rosevear-ai-hub');
      await choose('#ql328-scenario','http_503');
      expect(view.querySelector('.ql328-receipt')?.textContent).toContain('SOURCE_UNAVAILABLE');
      await act(async()=>view.querySelectorAll<HTMLButtonElement>('.ql328-actions button')[0].click());
      await act(async()=>view.querySelectorAll<HTMLButtonElement>('.ql328-actions button')[1].click());
      expect(view.querySelector('.ql328-receipt')?.textContent).toContain('2 / 3');
      await act(async()=>view.querySelector<HTMLButtonElement>('.ql328-reveal')!.click());
      expect(view.querySelector('#ql328-packet-data')?.textContent).toContain('"delivery": "UNSENT"');
      await act(async()=>view.querySelectorAll<HTMLButtonElement>('.ql328-actions button')[2].click());
      expect(view.querySelector('.ql328-receipt')?.textContent).toContain('CANCELLED_LOCALLY');
      await act(async()=>view.querySelectorAll<HTMLButtonElement>('.ql328-actions button')[3].click());
      expect(view.querySelector('.ql328-receipt')?.textContent).toContain('MISSING_ORIGINAL_PROOF');
      expect(spy).not.toHaveBeenCalled();expect(window.localStorage.length).toBe(0);
    }finally{spy.mockRestore();}
  });
  it('has keyboard focus, tablet/mobile styling and no runtime network, key or persistence path',()=>{
    const css=readFileSync('src/operator/ql328-dry-run-orchestrator.css','utf8');
    const model=readFileSync('src/operator/ql328DryRunOrchestrator.ts','utf8');
    const ui=readFileSync('src/operator/Ql328DryRunOrchestrator.tsx','utf8');
    for(const token of ['min-height:44px',':focus-visible','overflow:auto','max-width:610px','forced-colors:active','prefers-reduced-motion:reduce'])expect(css).toContain(token);
    for(const token of ['aria-labelledby','aria-live','<table>','role="note"','aria-expanded'])expect(ui).toContain(token);
    expect(model+ui).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
    expect(model+ui).not.toContain('import.meta.env');
  });
});
