import {describe,expect,it} from 'vitest';
import {ownerEntryTruth} from '../ql374OwnerEntry';
import {QL375_HELP_LINKS,QL375_SHELLS,ownerShellStatus,safeOwnerHelpLink}
  from '../ql375OwnerStatus';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T18:00:00Z');
const pending=():OwnerProgress=>({
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,connectionsState:'DISCONNECTED / HOLD',
  privateTestAuthorized:false,snapshotAt:new Date(NOW).toISOString()
});
const truth=(progress:OwnerProgress|null=pending(),nowMs=NOW,aal2=true)=>
  ownerEntryTruth({role:'source',aal2,enrolled:false,progress,nowMs});

describe('QL-375 immutable read-only six-source catalogue',()=>{
  it('maps exactly six independent platform or support identities, not sample tenants',()=>{
    expect(QL375_SHELLS.map(x=>x.id)).toEqual([
      'yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub'
    ]);
    expect(new Set(QL375_SHELLS.map(x=>x.repository)).size).toBe(6);
    expect(QL375_SHELLS.find(x=>x.id==='yw')?.boundary).toContain('not Rosevear Landscaping');
    expect(QL375_SHELLS.find(x=>x.id==='icamp')?.boundary).toContain('not Camp Rosevear');
  });
  it('reports aggregate HOLD with explicit no individual source attestation',()=>{
    const result=ownerShellStatus(truth());
    expect(result.kind).toBe('held');
    expect(result.detail).toContain('aggregate evidence, not an individual live source check');
    expect(truth().mayActivateSource).toBe(false);
  });
  it('does not promote AAL1, stale, role-mismatched, incomplete or drifted proof',()=>{
    expect(ownerShellStatus(truth(null)).kind).toBe('unknown');
    expect(ownerShellStatus(truth(pending(),NOW+125000)).kind).toBe('unknown');
    expect(ownerShellStatus(truth(pending(),NOW,false)).kind).toBe('unknown');
    expect(ownerShellStatus(truth({...pending(),ownerRole:'master'})).kind).toBe('unknown');
    expect(ownerShellStatus(truth({...pending(),heldApplicationShells:5})).kind).toBe('stop');
    expect(ownerShellStatus(truth({...pending(),activeOwnerMemberships:2})).kind).toBe('stop');
  });
  it('only permits fixed internal help or official repository documentation',()=>{
    expect(QL375_HELP_LINKS.map(x=>x.id)).toEqual(['status','ceremony','guide']);
    for(const help of QL375_HELP_LINKS)expect(safeOwnerHelpLink(help.href)).toBe(true);
    expect(safeOwnerHelpLink('javascript:alert(1)')).toBe(false);
    expect(safeOwnerHelpLink('https://evil.example/?token=secret')).toBe(false);
    expect(safeOwnerHelpLink('#owner-activate')).toBe(false);
  });
});
