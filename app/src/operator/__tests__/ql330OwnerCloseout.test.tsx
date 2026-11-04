// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {describe,it,expect,beforeEach,afterEach,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL330_STATUS,QL330_SHELLS,QL330_SUPPORT,QL330_IMMUTABLE_CONNECT_GATES,
 QL330_PROCEDURES,QL330_REVISION_OPTIONS,QL330_STEP_LIBRARY,QL330_PORTAL_EVENTS,QL330_REPORTS,
 ql330InitialDraft,ql330ProposeRevision,ql330ReviewScope,ql330Readback} from '../ql330OwnerCloseout';

describe('QL-330 procedure governance and autonomous connection HOLD contracts',()=>{
  it('reconciles 19 prior completed releases and all 6 shell/support HOLD roles, with no live authority',()=>{
    expect(ql330Readback()).toMatchObject({batchCompletedBeforeFinal:19,batchTarget:20,
      fourShells:4,twoSupports:2,uniqueSources:6,procedures:3,
      proceduresAllUnapproved:true,mandatoryGatesPinned:true,
      portalSchemas:5,reportDefinitions:6,allHeld:true,masterProvisioned:false,
      liveConnections:0,sourceGets:0,sourceWrites:0,realClientRecords:0,
      credentialReads:0,ownerDeviceAcceptance:false});
    expect(QL330_STATUS).toMatchObject({ack:'UNDER_REVIEW / PARKED_FOR_LATER',
      windowsRelay:'OFF',provisionedMaster:false,activeConnections:0});
    expect(QL330_SUPPORT).toHaveLength(2);
    for(const shell of QL330_SHELLS)expect(shell).toMatchObject({
      connectionIdentity:'SHELL',status:'DISCONNECTED / HOLD',
      childAccess:'NOT_AUTHORIZED',vaultHandle:'NOT_PROVISIONED',
      approvedProcedures:0,privateGets:0});
  });
  it.each(QL330_PROCEDURES.map(x=>x.id))('%s creates an immutable unapproved version 1 with required gates',id=>{
    const plan=ql330InitialDraft(id);
    expect(plan).toMatchObject({id,version:1,parentVersion:null,status:'DRAFT_NOT_APPLIED',
      approved:false,persisted:false,connectionEnabled:false});
    expect(new Set(plan.steps).size).toBe(plan.steps.length);
    const base=QL330_PROCEDURES.find(x=>x.id===id)!;
    expect(plan.steps).toEqual(base.steps);
  });
  it.each(QL330_PROCEDURES.map(x=>x.id))('%s can safely propose a review follow-up without changing source data',id=>{
    const first=ql330InitialDraft(id);
    const next=ql330ProposeRevision(first,'add_review');
    expect(first.version).toBe(1);expect(first.steps).not.toContain('review_followup');
    expect(next.version).toBe(2);expect(next.parentVersion).toBe(1);
    expect(next.steps).toContain('review_followup');
    expect(next).toMatchObject({approved:false,persisted:false,connectionEnabled:false});
    const after=ql330ProposeRevision(next,'add_latency');
    expect(after.version).toBe(3);
    expect(after.approved).toBe(false);
    expect(()=>ql330ProposeRevision(after,'add_latency')).toThrow('UNCHANGED_PROCEDURE');
  });
  it('protects connection proof, owner consent, encrypted secret, TEST and signed-receipt gate order',()=>{
    const source=ql330InitialDraft('connect-readonly');
    for(const option of QL330_REVISION_OPTIONS){
      const next=ql330ProposeRevision(source,option.id);
      expect(QL330_IMMUTABLE_CONNECT_GATES.every(step=>next.steps.includes(step))).toBe(true);
      const positions=QL330_IMMUTABLE_CONNECT_GATES.map(step=>next.steps.indexOf(step));
      expect(positions).toEqual([...positions].sort((a,b)=>a-b));
    }
    const missing={...source,steps:source.steps.filter(s=>s!=='approve_test')};
    expect(()=>ql330ProposeRevision(missing,'add_review')).toThrow('UNSAFE_BASE_PROCEDURE');
    const reversed={...source,steps:['approve_test','verify_issuer',...source.steps.filter(x=>x!=='approve_test'&&x!=='verify_issuer')] as typeof source.steps};
    expect(()=>ql330ProposeRevision(reversed,'add_review')).toThrow('UNSAFE_GATE_ORDER');
    expect(()=>ql330ProposeRevision({...source,version:-1},'add_review')).toThrow('INVALID_VERSION');
    expect(()=>ql330ProposeRevision(source,'not-a-step' as 'add_review')).toThrow('UNKNOWN_SAFE_REVISION');
  });
  it('denies master identity, child-as-connector, support customer, and unknown sources even when flags claim approval',()=>{
    for(const shell of QL330_SHELLS){
      const root={sourceId:shell.id,audience:'master' as const,
        masterSessionVerified:true,ownerGrantVerified:true,sourceProofVerified:true};
      expect(ql330ReviewScope(root)).toMatchObject({decision:'DENY_UNPROVISIONED_MASTER',
        status:'DISCONNECTED / HOLD',calls:0,secretReads:0,writes:0,approved:false});
      expect(ql330ReviewScope({...root,audience:'child',childId:shell.ownerExample}).decision).toBe('DENY_CHILD_AS_CONNECTOR');
    }
    expect(ql330ReviewScope({sourceId:'ai-data-platform',audience:'child',
      masterSessionVerified:true,ownerGrantVerified:true,sourceProofVerified:true}).decision).toBe('DENY_SUPPORT_CUSTOMER');
    expect(ql330ReviewScope({sourceId:'Camp Rosevear',audience:'shell',
      masterSessionVerified:true,ownerGrantVerified:true,sourceProofVerified:true}).decision).toBe('DENY_UNKNOWN_SOURCE');
  });
  it('has no default customer data export, reporting records or credential values',()=>{
    expect(QL330_PORTAL_EVENTS).toHaveLength(5);
    expect(QL330_REPORTS).toHaveLength(6);
    for(const kind of QL330_PORTAL_EVENTS)expect(kind.exportsPII).toBe(false);
    for(const r of QL330_REPORTS)expect(r.required.length).toBeGreaterThan(3);
    expect(QL330_STEP_LIBRARY.some(s=>s.id==='pause_on_failure')).toBe(true);
  });
});
let root:Root,host:HTMLDivElement;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.localStorage.clear();host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
describe('QL-330 I.T., Management, Analytics, Status owner walkthrough UI',()=>{
  async function open(label:string){const nav=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(x=>x.textContent?.includes(label))!;
    expect(nav).toBeTruthy();await act(async()=>nav.click());return host.querySelector<HTMLElement>('.ql330')!;}
  async function choose(id:string,value:string){const s=host.querySelector<HTMLSelectElement>(id)!;
    const setter=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value')!.set!;
    await act(async()=>{setter.call(s,value);s.dispatchEvent(new Event('change',{bubbles:true}));});}
  it('renders six sources, local procedure designer, portal events and reporting without live data',async()=>{
    const screen=await open('IT Command');
    expect(screen.getAttribute('data-ql330-release')).toContain('control-plane-blueprint');
    expect(screen.querySelectorAll('.ql330-scroll tbody tr').length).toBe(12);
    expect(screen.querySelectorAll('.ql330-chip-grid article')).toHaveLength(5);
    expect(screen.textContent).toContain('0 / 6 CONNECTED');
    expect(screen.textContent).toContain('19 / 20');
    expect(screen.textContent).toContain('DENY_CHILD_AS_CONNECTOR');
    expect(screen.textContent).toContain('database');
  });
  it('renders the model across Management, Analytics and Status surfaces with consistent holds',async()=>{
    for(const mode of ['Management','Analytics & statistics','System status']){
      const screen=await open(mode);
      expect(screen.textContent).toContain('0 / 6 CONNECTED');
      expect(screen.textContent).toContain('Master');
    }
  });
  it('changes draft procedure versions and restores a safe local draft without fetch or storage',async()=>{
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    try{
      const screen=await open('IT Command');
      const buttons=[...screen.querySelectorAll<HTMLButtonElement>('.ql330-actions button')];
      await act(async()=>buttons[0].click());
      expect(screen.querySelector('.ql330-outcome')?.textContent).toContain('v2');
      await choose('#ql330-procedure','management-reporting');
      expect(screen.querySelector('.ql330-outcome')?.textContent).toContain('v1');
      await act(async()=>buttons[0].click());
      expect(screen.querySelector('.ql330-outcome')?.textContent).toContain('v2');
      await act(async()=>buttons[1].click());
      expect(screen.querySelector('.ql330-outcome')?.textContent).toContain('v1');
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(window.localStorage.length).toBe(0);
    }finally{fetchSpy.mockRestore();}
  });
  it('keeps checklist review state local and states no real owner approval',async()=>{
    const screen=await open('IT Command');
    const button=screen.querySelector<HTMLButtonElement>('[aria-controls="ql330-checklist"]')!;
    await act(async()=>button.click());
    const checklist=screen.querySelector<HTMLElement>('#ql330-checklist')!;
    expect(checklist.querySelectorAll('input[type=checkbox]')).toHaveLength(8);
    expect(screen.textContent).toContain('not');
    await act(async()=>button.click());expect(screen.querySelector('#ql330-checklist')).toBeNull();
  });
  it('documents accessibility, responsive CSS, no privileged browser calls, and database proposal fail-closed boundaries',()=>{
    const css=readFileSync('src/operator/ql330-owner-closeout.css','utf8');
    const ui=readFileSync('src/operator/Ql330OwnerCloseout.tsx','utf8');
    const model=readFileSync('src/operator/ql330OwnerCloseout.ts','utf8');
    for(const s of ['min-height:44px',':focus-visible','overflow:auto','max-width:1050px','max-width:680px','forced-colors:active','prefers-reduced-motion:reduce'])expect(css).toContain(s);
    for(const s of ['aria-labelledby','aria-live','role="note"','scope="row"','aria-expanded'])expect(ui).toContain(s);
    expect(ui+model).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
    expect(ui+model).not.toContain('service_role');
    const sql=readFileSync('../database/proposals/ql330_master_connection_control_plane.sql','utf8');
    expect(sql).toContain('NON-EXECUTED / REVIEW-ONLY');
    expect(sql).toContain('REVOKE ALL ON SCHEMA rosevear_control');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    expect(sql).not.toMatch(/CREATE POLICY/i);
    expect(sql).not.toMatch(/INSERT INTO/i);
    expect(sql).toContain('external_key_handle');
    expect(sql).toContain('ON DELETE RESTRICT');
  });
});
