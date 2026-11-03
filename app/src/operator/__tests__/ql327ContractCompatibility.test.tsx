// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL327_ADDITIVE_VERSION,QL327_BASELINE_VERSION,QL327_BOUNDARY,QL327_BREAKING_VERSION,
  QL327_REQUIRED_FIELDS,QL327_SCENARIOS,QL327_SOURCE_MATRIX,QL327_VERSION_MATRIX,
  ql327RegressionMatrix,ql327RunScenario,ql327SyntheticFixture,ql327ValidateResponse,
  type Ql327Decision} from '../ql327ContractCompatibility';
import {QL326_ROWS} from '../ql326ConnectionConfiguration';

describe('QL-327 versioned synthetic compatibility engine',()=>{
  it('owns six unique source roles, four independent business tenants and two tenantless supports',()=>{
    expect(QL327_SOURCE_MATRIX).toHaveLength(6);
    expect(new Set(QL327_SOURCE_MATRIX.map(row=>row.id)).size).toBe(6);
    expect(QL327_SOURCE_MATRIX.map(row=>row.id)).toEqual(QL326_ROWS.map(row=>row.id));
    expect(QL327_SOURCE_MATRIX.filter(row=>row.role==='business')).toHaveLength(4);
    expect(QL327_SOURCE_MATRIX.filter(row=>row.role==='support')).toHaveLength(2);
    expect(new Set(QL327_SOURCE_MATRIX.filter(row=>row.role==='business').map(row=>row.fixtureAlias)).size).toBe(4);
    expect(QL327_VERSION_MATRIX.map(version=>version.id)).toEqual([
      QL327_BASELINE_VERSION,QL327_ADDITIVE_VERSION,QL327_BREAKING_VERSION]);
    expect(QL327_REQUIRED_FIELDS).toHaveLength(11);
    for(const row of QL327_SOURCE_MATRIX){
      expect(row.status).toBe('DISCONNECTED / HOLD');
      expect(row).toMatchObject({method:'GET',connected:false,authenticated:false,approved:false,consentGranted:false});
      expect(row.endpoints).toEqual(['/api/integration/v1/health','/api/integration/v1/capabilities']);
      expect(row.allowedCapability.startsWith('preview_')).toBe(true);
      if(row.role==='support'){expect(row.fixtureAlias).toBeNull();expect(row.businessId).toBeNull();}
      else{expect(row.fixtureAlias).toMatch(/^np-/);expect(row.businessId).toMatch(/^np-/);}
    }
    expect(QL327_BOUNDARY).toMatchObject({sources:6,businesses:4,support:2,versions:3,
      productionConnections:0,authenticatedHandshakes:0,gatewayRequests:0,sourceWrites:0,
      customerRecords:0,secretReads:0,ownerApprovals:0,privateRelay:'OFF'});
  });
  it.each(QL327_SOURCE_MATRIX.map(row=>row.id))('accepts only local %s v1 and additive v1.1 shapes without authorization',source=>{
    for(const [version,expected] of [[QL327_BASELINE_VERSION,'BASELINE_SHAPE_ONLY_NOT_AUTHORIZED'],
      [QL327_ADDITIVE_VERSION,'ADDITIVE_DRAFT_NOT_AUTHORIZED']] as const){
      const fixture=ql327SyntheticFixture(source,version);
      expect(QL327_REQUIRED_FIELDS.every(field=>Object.hasOwn(fixture,field))).toBe(true);
      const output=ql327ValidateResponse(source,fixture);
      expect(output).toMatchObject({decision:expected,shapeCompatible:true,stage:'complete',
        authorized:false,authenticated:false,requests:0,writes:0,customerRecords:0,secretReads:0,
        consentGranted:false,connection:'DISCONNECTED / HOLD'});
      expect(output.rollback).toContain('No remote rollback');
    }
    const breaking=ql327ValidateResponse(source,ql327SyntheticFixture(source,QL327_BREAKING_VERSION));
    expect(breaking).toMatchObject({decision:'DENY_VERSION_MISMATCH',stage:'schema',shapeCompatible:false,authorized:false});
  });
  it('runs all 66 business/support positive and negative cases with their exact declared decisions',()=>{
    expect(QL327_SCENARIOS).toHaveLength(11);
    const matrix=ql327RegressionMatrix();
    expect(matrix).toMatchObject({cases:66,rejected:60,matchesDeclaredDecisions:true,
      businessCount:4,supportCount:2,allHeld:true,authenticatedHandshakes:0,sourceRequests:0,sourceWrites:0});
    for(const row of QL327_SOURCE_MATRIX){
      for(const scenario of QL327_SCENARIOS){
        const result=ql327RunScenario(row.id,scenario.id);
        expect(result.result.decision).toBe(scenario.expect as Ql327Decision);
        expect(result).toMatchObject({requestedRealHandshake:false,networkRequests:0,
          providerWrites:0,rollbackApplied:false});
        expect(result.result.authorized).toBe(false);
      }
    }
  });
  it('fails closed for unexpected fields, malformed input, wrong fixtures and unsafe optional metadata',()=>{
    const original=ql327SyntheticFixture('rosiedazzlers');
    const expectReject=(sample:unknown,code:Ql327Decision)=>{
      const result=ql327ValidateResponse('rosiedazzlers',sample);
      expect(result).toMatchObject({decision:code,shapeCompatible:false,authorized:false,requests:0,writes:0});
    };
    expectReject(null,'DENY_NOT_OBJECT');expectReject([],'DENY_NOT_OBJECT');
    expect(ql327ValidateResponse('nonexistent',original).decision).toBe('DENY_UNKNOWN_SOURCE');
    expectReject({...original,tenant_id:'np-icamp-demo'},'DENY_TENANT_BOUNDARY');
    expectReject({...original,business_id:'np-devilndove-business'},'DENY_TENANT_BOUNDARY');
    expectReject({...original,role:'support'},'DENY_ROLE_BOUNDARY');
    expectReject({...original,source_system:'devilndove'},'DENY_SOURCE_IDENTITY');
    expectReject({...original,method:'POST'},'DENY_METHOD_OR_ENDPOINT');
    expectReject({...original,endpoint:'/private/customer'},'DENY_METHOD_OR_ENDPOINT');
    expectReject({...original,environment:'production'},'DENY_METHOD_OR_ENDPOINT');
    expectReject({...original,capabilities:['write_records']},'DENY_UNEXPECTED_PRIVILEGE');
    expectReject({...original,capabilities:[]},'DENY_UNEXPECTED_PRIVILEGE');
    expectReject({...original,connection_status:'CONNECTED'},'DENY_ELEVATED_CONNECTION');
    expectReject({...original,consent_marker:'REAL_CUSTOMER_APPROVED'},'DENY_CONSENT_MARKER');
    expectReject({...original,customer_email:'redacted'},'DENY_UNEXPECTED_FIELD');
    expectReject({...original,schema_version:'rosevear.integration.v0'},'DENY_VERSION_MISMATCH');
    expectReject({...original,trace_label:'test-label'},'DENY_UNEXPECTED_FIELD');
    expectReject({...ql327SyntheticFixture('rosiedazzlers',QL327_ADDITIVE_VERSION),trace_label:'customer@email.ca'},'DENY_UNSAFE_TRACE');
    const missing={...original} as Record<string,unknown>;delete missing.tenant_id;
    expectReject(missing,'DENY_REMOVED_FIELD');
    const noConsent={...original} as Record<string,unknown>;delete noConsent.consent_marker;
    expectReject(noConsent,'DENY_MISSING_CONSENT');
  });
  it('rejects assigning a customer tenant to a support system and preserves fixture isolation after scenarios',()=>{
    const support=ql327SyntheticFixture('ai-data-platform');
    expect(ql327ValidateResponse('ai-data-platform',{...support,tenant_id:'np-rosie-demo'}).decision).toBe('DENY_TENANT_BOUNDARY');
    expect(ql327ValidateResponse('ai-data-platform',{...support,role:'business'}).decision).toBe('DENY_ROLE_BOUNDARY');
    const before=ql327SyntheticFixture('icamp');
    ql327RunScenario('icamp','unexpected_privilege');ql327RunScenario('icamp','wrong_tenant');
    expect(ql327SyntheticFixture('icamp')).toEqual(before);
    expect(ql327SyntheticFixture('rosiedazzlers').tenant_id).not.toBe(before.tenant_id);
    expect(()=>ql327SyntheticFixture('unknown')).toThrow('UNKNOWN_SYNTHETIC_SOURCE');
  });
});

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.localStorage.clear();host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

describe('QL-327 I.T. Command fixture handshake UI',()=>{
  async function open(){const nav=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(b=>b.textContent?.includes('IT Command'))!;
    await act(async()=>nav.click());return host.querySelector<HTMLElement>('.ql327')!;}
  async function choose(selector:string,value:string){const el=host.querySelector<HTMLSelectElement>(selector)!;
    const setter=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value')!.set!;
    await act(async()=>{setter.call(el,value);el.dispatchEvent(new Event('change',{bubbles:true}));});}
  it('renders six-source version matrix, 66-case readback, stages, named fields and honest hold markers',async()=>{
    const view=await open();
    expect(view.getAttribute('data-ql327-release')).toBe('six-source-synthetic-contract-matrix-v1');
    expect(view.querySelectorAll('.ql327-table-wrap tbody tr')).toHaveLength(6);
    expect(view.querySelectorAll('.ql327-version-grid article')).toHaveLength(3);
    expect(view.querySelectorAll('.ql327-stage-grid>div')).toHaveLength(8);
    expect(view.querySelectorAll('.ql327-field-list code')).toHaveLength(11);
    expect(view.textContent).toContain('0 / 6 AUTHENTICATED');
    expect(view.textContent).toContain('66');
    expect(view.textContent).toContain('BASELINE_SHAPE_ONLY_NOT_AUTHORIZED');
    expect(view.textContent).toContain('0 authenticated handshakes');
  });
  it('switches version and failure cases but never calls providers or persists data',async()=>{
    const spy=vi.spyOn(globalThis,'fetch');
    try{
      const view=await open();
      await choose('#ql327-source','rosevear-ai-hub');
      await choose('#ql327-version',QL327_ADDITIVE_VERSION);
      expect(view.querySelector('.ql327-outcome')?.textContent).toContain('ADDITIVE_DRAFT_NOT_AUTHORIZED');
      await choose('#ql327-scenario','support_as_business');
      expect(view.querySelector('.ql327-outcome')?.textContent).toContain('DENY_ROLE_BOUNDARY');
      await choose('#ql327-scenario','absent_consent');
      expect(view.querySelector('.ql327-outcome')?.textContent).toContain('DENY_MISSING_CONSENT');
      const reveal=view.querySelector<HTMLButtonElement>('.ql327-actions button')!;
      await act(async()=>reveal.click());
      expect(view.querySelector('#ql327-fixture')?.textContent).toContain('rosevear-ai-hub');
      expect(view.querySelector('#ql327-fixture')?.textContent).not.toContain('access_token');
      await act(async()=>view.querySelectorAll<HTMLButtonElement>('.ql327-actions button')[1].click());
      expect(view.querySelector('#ql327-fixture')).toBeNull();
      expect(view.querySelector('.ql327-outcome')?.textContent).toContain('BASELINE_SHAPE_ONLY_NOT_AUTHORIZED');
      expect(spy).not.toHaveBeenCalled();expect(window.localStorage.length).toBe(0);
    }finally{spy.mockRestore();}
  });
  it('uses accessible stage/response labels, a responsive layout and no runtime network path',()=>{
    const css=readFileSync('src/operator/ql327-contract-compatibility.css','utf8');
    const model=readFileSync('src/operator/ql327ContractCompatibility.ts','utf8');
    const ui=readFileSync('src/operator/Ql327ContractCompatibility.tsx','utf8');
    for(const token of ['min-height:44px',':focus-visible','overflow:auto','max-width:610px','forced-colors:active','prefers-reduced-motion:reduce'])expect(css).toContain(token);
    for(const token of ['aria-labelledby','aria-live','<table>','role="note"','aria-expanded'])expect(ui).toContain(token);
    expect(model+ui).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
    expect(model+ui).not.toContain('import.meta.env');
  });
});
