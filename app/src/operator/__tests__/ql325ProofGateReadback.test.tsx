// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL325_BOUNDARY,QL325_FIVE_GATES,QL325_OBSERVED_AT,QL325_ROWS,
  ql325ClassifyResponse,ql325ImmutableUrl,ql325SnapshotFreshness} from '../ql325ProofGateReadback';

describe('QL-325 immutable proof and independent permission contract',()=>{
  it('preserves six distinct sources, four business tenants, two support systems and 0/30 authority',()=>{
    expect(QL325_ROWS).toHaveLength(6);
    expect(new Set(QL325_ROWS.map(row=>row.id)).size).toBe(6);
    expect(QL325_BOUNDARY).toMatchObject({sources:6,businesses:4,support:2,publicProofGETs:6,
      authenticatedGatewayGETs:0,sourceWrites:0,approvedGates:0,connected:0,ownerTESTApprovals:0,privateRelay:'OFF'});
    expect(QL325_FIVE_GATES.map(gate=>gate.id)).toEqual(['ORIGINAL_PROOF_B','INDEPENDENT_ORIGIN','TENANT_SCOPE','SCOPED_GET','OWNER_TEST']);
    for(const gate of QL325_FIVE_GATES){expect(gate.approved).toBe(false);expect(gate.next.length).toBeGreaterThan(40);}
    for(const row of QL325_ROWS){
      expect(row.connection).toBe('DISCONNECTED / HOLD');expect(row.authorized).toBe(false);
      expect(row.approvedGates).toBe(0);expect(row.requiredGates).toBe(5);
      expect(row.privateGatewayGets).toBe(0);expect(row.sourceWrites).toBe(0);
      expect(row.category==='business').toBe(row.isCustomerTenant);
    }
  });
  it('records exactly six credential-free 404 results at existing immutable source pins, never moving main',()=>{
    expect(QL325_OBSERVED_AT).toBe('2026-11-03T16:32:38Z');
    for(const row of QL325_ROWS){
      expect(row.current).toMatchObject({http:404,at:QL325_OBSERVED_AT,result:'MISSING_404',proofAccepted:false,permissionGranted:false});
      expect(row.current.url).toBe(ql325ImmutableUrl(row.repo,row.pinnedCommit));
      expect(row.current.url).toContain(`?ref=${row.current.sha}`);
      expect(row.current.url).not.toContain('ref=main');
      expect(row.current.sha).toMatch(/^[a-f0-9]{40}$/);
    }
    expect(()=>ql325ImmutableUrl('../bad','a'.repeat(40))).toThrow();
    expect(()=>ql325ImmutableUrl('rosiedazzlers','main')).toThrow();
  });
  it('keeps earlier public-main observation distinct from immutable historical reads and flags pin drift',()=>{
    for(const row of QL325_ROWS){
      expect(row.history.map(item=>item.build)).toEqual(['QL-270','QL-289','QL-290','QL-303','QL-325']);
      expect(row.history[0].kind).toBe('Public main-ref snapshot');
      expect(row.history.slice(1).every(item=>item.kind.includes('Immutable-path'))).toBe(true);
      expect(row.history[4].sha).toBe(row.history[3].sha);
      expect(row.driftTransitions).toBe(row.history.slice(1).filter((item,i)=>item.sha!==row.history[i].sha).length);
      expect(row.history.map(item=>item.at)).toEqual(['2026-10-30 (time not recorded)','2026-10-31T16:48:10Z','2026-10-31T17:40:31Z','2026-11-02T01:20:55Z',QL325_OBSERVED_AT]);
    }
  });
  it('separates HTTP 200, 403, 404, 429, 401, timeout and other errors without any authority grant',()=>{
    const codes:[number|null,string][]=[[200,'PRESENT_UNVERIFIED'],[403,'FORBIDDEN_403'],[404,'MISSING_404'],
      [429,'RATE_LIMITED_429'],[401,'AUTH_REQUIRED_401'],[null,'NETWORK_ERROR'],[503,'OTHER_PUBLIC_ERROR']];
    for(const [code,result] of codes){expect(ql325ClassifyResponse(code)).toMatchObject({result,proofAccepted:false,permissionGranted:false});}
    expect(ql325ClassifyResponse(200).meaning).toContain('unverified');
  });
  it('reports a dated or stale public snapshot with clock mismatch fail-closed',()=>{
    expect(ql325SnapshotFreshness(new Date('2026-11-03T17:00:00Z')).state).toBe('DATED_PUBLIC_SNAPSHOT');
    expect(ql325SnapshotFreshness(new Date('2026-11-04T16:32:38Z')).state).toBe('STALE_RECHECK_REQUIRED');
    expect(ql325SnapshotFreshness(new Date('2026-11-03T16:00:00Z')).state).toBe('CLOCK_REVIEW');
    expect(ql325SnapshotFreshness(new Date('invalid')).state).toBe('CLOCK_REVIEW');
  });
});

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});window.localStorage.clear();host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

describe('QL-325 IT Command UI readback',()=>{
  async function open(){const nav=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(row=>row.textContent?.includes('IT Command'))!;await act(async()=>nav.click());return host.querySelector<HTMLElement>('.ql325')!;}
  it('shows all six readback sources, historical links, five gates and honest four-response legend',async()=>{
    const view=await open();
    expect(view.getAttribute('data-ql325-release')).toBe('immutable-authority-no-go-v1');
    expect(view.querySelectorAll('.ql325-sources button')).toHaveLength(6);
    expect(view.querySelectorAll('.ql325-gates li')).toHaveLength(5);
    expect(view.querySelectorAll('.ql325-table-wrap tbody tr')).toHaveLength(5);
    expect(view.querySelectorAll('.ql325-legend>div')).toHaveLength(4);
    expect(view.textContent).toContain('0 / 30');expect(view.textContent).toContain('0 / 6 AUTHORIZED');
    expect(view.textContent).toContain('UNDER_REVIEW / PARKED_FOR_LATER');
    expect(view.textContent).toContain('HTTP 200 · PRESENT_UNVERIFIED');
    expect(view.textContent).toContain('HTTP 403 · FORBIDDEN_403');
    expect(view.textContent).toContain('HTTP 429 · RATE_LIMITED_429');
    expect(view.querySelectorAll('.ql325-table-wrap a')).toHaveLength(4);
  });
  it('switches source, preserves independent support scope, and makes no requests or local persistence',async()=>{
    const view=await open();
    const support=[...view.querySelectorAll<HTMLButtonElement>('.ql325-sources button')].find(button=>button.textContent?.includes('Rosevear AI Hub'))!;
    await act(async()=>support.click());
    expect(support.getAttribute('aria-pressed')).toBe('true');
    expect(view.querySelector('#ql325-active-title')?.textContent).toContain('Rosevear AI Hub');
    expect(view.textContent).toContain('no customer tenant');
    expect(view.textContent).toContain('Private Windows relay');
    expect(view.textContent).toContain('DISCONNECTED / HOLD');
    expect(window.localStorage.length).toBe(0);
  });
  it('keeps accessible focus, status language, small-screen rules and no runtime network call path',()=>{
    const css=readFileSync('src/operator/ql325-proof-gate-readback.css','utf8');
    const ui=readFileSync('src/operator/Ql325ProofGateReadback.tsx','utf8');
    const model=readFileSync('src/operator/ql325ProofGateReadback.ts','utf8');
    for(const token of ['min-height:44px',':focus-visible','overflow-x:auto','max-width:580px','forced-colors:active','prefers-reduced-motion:reduce'])expect(css).toContain(token);
    for(const token of ['aria-pressed','aria-labelledby','<table>','role="note"'])expect(ui).toContain(token);
    expect(ui+model).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
  });
});
