// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OwnerReadinessSupport} from '../OwnerReadinessSupport';
import {OwnerProgressDashboard} from '../OwnerProgressDashboard';
import {OWNER_HELP_LINKS} from '../ql373OwnerReadiness';
import type {OwnerCeremonyGateway} from '../ql369OwnerEnrollment';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T17:00:00Z');
const sha='ab'.repeat(32);
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
let host:HTMLDivElement;let root:Root;
beforeEach(()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  vi.spyOn(Date,'now').mockReturnValue(NOW);
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});
const show=async(role:'source'|'master'='source',p:OwnerProgress|null=snapshot(),mfa=true)=>
  act(async()=>root.render(<OwnerReadinessSupport ownerRole={role} progress={p}
    mfaVerified={mfa} intentSupplied={true} nowMs={NOW}/>));
const click=async(label:string)=>{
  const button=[...host.querySelectorAll('button')].find(x=>x.textContent?.includes(label));
  expect(button).toBeTruthy();
  await act(async()=>button!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
};
const select=async(id:string,value:string)=>{
  const input=host.querySelector(`#${id}`) as HTMLSelectElement;
  await act(async()=>{
    const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')?.set;
    setter?.call(input,value);
    input.dispatchEvent(new Event('change',{bubbles:true}));
  });
};

describe('QL-373 accessible independent device notes',()=>{
  it('links only to fixed safe sources and diagnoses without activation controls',async()=>{
    await show();
    expect(host.textContent).toContain('Record your own server-verified attestation');
    const links=[...host.querySelectorAll('nav[aria-label="Safe owner help links"] a')];
    expect(links).toHaveLength(3);
    expect(links.map(a=>a.getAttribute('href'))).toEqual(OWNER_HELP_LINKS.map(x=>x.href));
    expect(links.every(a=>a.getAttribute('rel')==='noopener noreferrer')).toBe(true);
    expect(host.querySelector('fieldset legend')?.textContent).toContain('Ree');
    expect(host.querySelectorAll('input[type="file"]')).toHaveLength(0);
    expect(host.querySelectorAll('.ql373-support input')).toHaveLength(0);
    expect(host.textContent).toContain('No private TEST');
  });
  it('keeps fixed observations in memory and copies only after an explicit click',async()=>{
    const writeText=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});
    await show('master',{...snapshot(),ownerRole:'master'});
    expect(host.querySelector('fieldset legend')?.textContent).toContain('Jack');
    const note=host.querySelector('#ql373-safe-note') as HTMLTextAreaElement;
    expect(note.readOnly).toBe(true);
    expect(note.value).toContain('Jack (master)');
    expect(writeText).not.toHaveBeenCalled();
    await select('ql373-keyboard','worked');
    await select('ql373-blocker','accessibility');
    expect(note.value).toContain('Worked on this device');
    expect(note.value).toContain('Keyboard or screen reader');
    await click('Copy safe observation note');
    expect(writeText).toHaveBeenCalledExactlyOnceWith(note.value);
    expect(note.value).not.toContain(sha);
    await click('Clear observations');
    expect(note.value).not.toContain('Worked on this device');
    expect(note.value).toContain('Not tested');
  });
  it('treats AAL1 and drift as a visible block and never offers signed enrollment',async()=>{
    await show('source',null,false);
    expect(host.textContent).toContain('Finish your own authenticator challenge');
    await show('source',{...snapshot(),heldApplicationShells:5});
    expect(host.querySelector('.ql373-stop[role="alert"]')).toBeTruthy();
    expect(host.textContent).toContain('Do not retry final activation');
    expect(host.textContent).toContain('Not an owner signature or activation');
  });
  it('adds no network calls to the one existing QL-370 protected status readback',async()=>{
    const invoke=vi.fn().mockResolvedValue({data:snapshot(),error:null});
    const gateway={functions:{invoke}} as OwnerCeremonyGateway;
    await act(async()=>root.render(<OwnerProgressDashboard gateway={gateway}
      ownerRole="source" mfaVerified={true} intentSha256={sha}
      refreshSequence={0} onClearLocal={()=>{}}/>));
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('ql369-owner-enrollment',{
      body:{action:'status',intentSha256:sha}});
    expect(host.querySelector('#ql370-refresh-status')).toBeTruthy();
    expect(host.textContent).toContain('INDEPENDENT DEVICE NOTES');
  });
});
