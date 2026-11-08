// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {MasterOperatorEntry} from '../MasterOperatorEntry';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T18:00:00Z');
const snapshot=(role:'source'|'master'='source'):OwnerProgress=>({
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:role,sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,
  connectionsState:'DISCONNECTED / HOLD',privateTestAuthorized:false,
  snapshotAt:new Date(NOW).toISOString()
});
let root:Root;let host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  vi.spyOn(Date,'now').mockReturnValue(NOW);
  host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});
const show=async(role:'source'|'master'='source',progress:OwnerProgress|null=snapshot(),aal2=true)=>
  act(async()=>root.render(<MasterOperatorEntry ownerRole={role} enrolled={false} aal2={aal2} progress={progress}/>));
const click=async(text:string)=>{
  const button=[...host.querySelectorAll('button')].find(x=>x.textContent?.includes(text));
  expect(button).toBeTruthy();
  await act(async()=>button!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
};
describe('QL-374 accessible personal owner navigation',()=>{
  it('shows personal entry and a four-item status-only navigation',async()=>{
    await show();
    expect(host.querySelector('#ql374-title')?.textContent).toContain('Ree');
    expect(host.querySelectorAll('nav[aria-label="Owner operator shell sections"] button')).toHaveLength(4);
    expect(host.textContent).toContain('Pending signed approval');
    expect(host.textContent).toContain('Read-only aggregate status; no per-source authority');
    expect(host.querySelectorAll('input,textarea,select')).toHaveLength(0);
    await click('I.T. and security');
    expect(host.querySelector('button[aria-current="page"]')?.textContent).toContain('I.T. and security');
    expect(host.querySelector('#ql374-current-heading')).toBe(document.activeElement);
    expect(host.textContent).toContain('6 of 6 shell HOLD restrictions');
    expect(host.textContent).toContain('zero Supabase Auth users at early preflight');
    expect(host.querySelector('a[href="#ql370-refresh-status"]')).toBeTruthy();
    await click('Getting started');
    expect(host.textContent).toContain('public operator preview for synthetic training only');
  });
  it('keeps Ree and Jack on separate personal views without stored role choices',async()=>{
    await show('master',snapshot('master'));
    expect(host.querySelector('#ql374-title')?.textContent).toContain('Jack');
    await click('I.T. and security');
    expect(host.textContent).toContain('0. Customer operations');
    expect(host.querySelectorAll('input[type="file"]')).toHaveLength(0);
  });
  it('explicitly blocks missing, stale or inconsistent protected readbacks',async()=>{
    await show('source',null);
    await click('I.T. and security');
    expect(host.textContent).toContain('not yet confirmed');
    await show('source',{...snapshot(),heldApplicationShells:5});
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('STOP');
    await show('source',snapshot(),false);
    expect(host.textContent).toContain('Finish personal MFA');
  });
});
