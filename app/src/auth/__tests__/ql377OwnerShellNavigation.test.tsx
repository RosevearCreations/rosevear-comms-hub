// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {MasterOperatorEntry} from '../MasterOperatorEntry';
import type {OwnerProgress} from '../ql370OwnerProgress';

const progress:OwnerProgress={
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,connectionsState:'DISCONNECTED / HOLD',
  privateTestAuthorized:false,snapshotAt:new Date(Date.now()-2000).toISOString()
};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const nav=async(name:string)=>{
  const button=Array.from(host.querySelectorAll<HTMLButtonElement>('nav button'))
    .find(node=>node.textContent?.includes(name));
  expect(button).toBeTruthy();
  await act(async()=>button!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
};

describe('QL-377 shell history navigation and personal session isolation',()=>{
  it('keeps history across navigation but hides it after an owner changes',async()=>{
    await act(async()=>root.render(<MasterOperatorEntry ownerRole="source" enrolled={false} aal2={true} progress={progress}/>));
    await nav('I.T. and security');
    expect(host.textContent).toContain('session observations');
    expect(host.textContent).toContain('Six application shells held');
    await nav('My overview');
    await nav('I.T. and security');
    expect(host.textContent).toContain('1 of 1 session observations');
    await act(async()=>root.render(<MasterOperatorEntry ownerRole="master" enrolled={false} aal2={true} progress={null}/>));
    expect(host.textContent).toContain('0 of 0 session observations');
    await act(async()=>root.render(<MasterOperatorEntry ownerRole="master" enrolled={false} aal2={false} progress={null}/>));
    expect(host.textContent).toContain('0 of 0 session observations');
  });
});
