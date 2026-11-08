// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OwnerCeremonyWalkthrough} from '../OwnerCeremonyWalkthrough';
import {buildOwnerCeremonySteps} from '../ql371OwnerCeremony';
import {saveHelpPosition} from '../ql372OwnerResume';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T17:00:00Z');
const snapshot=():OwnerProgress=>({
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,
  connectionsState:'DISCONNECTED / HOLD',privateTestAuthorized:false,
  snapshotAt:new Date(NOW).toISOString()
});
const steps=(role:'source'|'master')=>buildOwnerCeremonySteps({
  progress:role==='source'?snapshot():{...snapshot(),ownerRole:'master'},
  mfaVerified:true,intentSupplied:false,ownerRole:role,nowMs:NOW
}).steps;

let host:HTMLDivElement;
let root:Root;
beforeEach(()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.sessionStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{
  await act(async()=>root.unmount());host.remove();
  window.sessionStorage.clear();vi.restoreAllMocks();
});

const click=async(text:string)=>{
  const button=[...host.querySelectorAll('button')].find(x=>x.textContent?.includes(text));
  expect(button,text).toBeTruthy();
  await act(async()=>button!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
};

describe('QL-372 screen-reader and keyboard acceptance',()=>{
  it('labels the supervised region and moves focus to the newly selected step heading',async()=>{
    await act(async()=>root.render(<OwnerCeremonyWalkthrough steps={steps('source')}
      progress={snapshot()} ownerRole="source" mfaVerified={true} nowMs={NOW}/>));
    expect(host.querySelector('[aria-labelledby="ql372-walkthrough-title"]')).toBeTruthy();
    expect(host.querySelector('[aria-live="polite"][aria-atomic="true"]')).toBeTruthy();
    expect(host.querySelector('[aria-label="Step-by-step walkthrough navigation"]')).toBeTruthy();
    await click('Next instruction');
    expect(host.querySelector('.ql372-counter')?.textContent).toBe('Instruction 2 of 7');
    expect(document.activeElement?.id).toBe('ql372-step-heading');
    expect(host.querySelector('.ql372-live')?.textContent).toContain('Viewing step 2 of 7');
    expect(window.sessionStorage.getItem('rosevear-comms-hub:ql372:help-position:source')).toBe('v1:ql369');
    expect(host.textContent).toContain('Navigation is only a reading aid');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });

  it('offers explicit step-only resume after a fresh protected readback, never auto-approval',async()=>{
    saveHelpPosition('source','self',window.sessionStorage);
    await act(async()=>root.render(<OwnerCeremonyWalkthrough steps={steps('source')}
      progress={snapshot()} ownerRole="source" mfaVerified={true} nowMs={NOW}/>));
    expect(host.textContent).toContain('non-sensitive help position');
    expect(host.textContent).toContain('Instruction 1 of 7');
    await click('Resume reading step 5');
    expect(host.textContent).toContain('Instruction 5 of 7');
    expect(document.activeElement?.id).toBe('ql372-step-heading');
    expect(host.querySelector('.ql372-live')?.textContent).toContain('Resumed viewing step 5');
    expect(host.textContent).toContain('does not complete enrollment');
    await click('Clear help position and start over');
    expect(window.sessionStorage.length).toBe(0);
    expect(host.textContent).toContain('Instruction 1 of 7');
  });

  it('never reads or writes a resume position with AAL1, stale status or a different owner',async()=>{
    saveHelpPosition('source','peer',window.sessionStorage);
    await act(async()=>root.render(<OwnerCeremonyWalkthrough steps={steps('source')}
      progress={snapshot()} ownerRole="source" mfaVerified={false} nowMs={NOW}/>));
    expect(host.textContent).toContain('Protected status needs verification');
    expect(host.textContent).not.toContain('Resume reading step');
    await click('Next instruction');
    expect(window.sessionStorage.getItem('rosevear-comms-hub:ql372:help-position:source')).toBe('v1:peer');
    await act(async()=>root.render(<OwnerCeremonyWalkthrough steps={steps('master')}
      progress={{...snapshot(),ownerRole:'master'}} ownerRole="master" mfaVerified={true} nowMs={NOW}/>));
    expect(host.textContent).not.toContain('Resume reading step');
    expect(window.sessionStorage.getItem('rosevear-comms-hub:ql372:help-position:master')).toBeNull();
  });

  it('makes Jack’s final step informational only and disables next at the end',async()=>{
    const jack={...snapshot(),ownerRole:'master' as const};
    await act(async()=>root.render(<OwnerCeremonyWalkthrough steps={steps('master')}
      progress={jack} ownerRole="master" mfaVerified={true} nowMs={NOW}/>));
    for(let i=0;i<6;i++)await click('Next instruction');
    expect(host.textContent).toContain('Instruction 7 of 7');
    expect(host.textContent).toContain('Only Ree can submit');
    const next=[...host.querySelectorAll('button')].find(x=>x.textContent?.includes('Next instruction'));
    expect(next?.disabled).toBe(true);
    expect(host.querySelectorAll('input[type="file"]')).toHaveLength(0);
  });
});
