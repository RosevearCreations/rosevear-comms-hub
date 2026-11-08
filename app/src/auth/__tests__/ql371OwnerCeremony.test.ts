import {describe,expect,it} from 'vitest';
import {buildOwnerCeremonySteps,countdownForAttestation,isOriginalActivationVerified,
  SAFE_OWNER_HANDOFF} from '../ql371OwnerCeremony';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T16:00:00Z');
const time=(minutes:number)=>new Date(NOW+minutes*60000).toISOString();
function data():OwnerProgress{return {
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'CURRENT',expiresAt:time(14)},
  peerAttestation:{state:'CURRENT',expiresAt:time(4)},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  heldApplicationShells:6,totalApplicationShells:6,
  connectionsState:'DISCONNECTED / HOLD',privateTestAuthorized:false,snapshotAt:time(0)
};}
const guide=(progress:OwnerProgress|null,intentSupplied=true,ownerRole:'source'|'master'='source')=>
  buildOwnerCeremonySteps({progress,mfaVerified:true,intentSupplied,ownerRole,nowMs:NOW});

describe('QL-371 protected countdown and original-owner ceremony guidance',()=>{
  it('shows 30-minute attestation expiry as a device-clock estimate, not authority',()=>{
    const c=countdownForAttestation('CURRENT',time(14),time(0),NOW);
    expect(c).toMatchObject({severity:'normal',verifiedCurrent:true});
    expect(c.text).toContain('About 14 minutes');
    expect(c.text).toContain('server rechecks');
  });
  it('warns at ten minutes and becomes urgent at five minutes',()=>{
    expect(countdownForAttestation('CURRENT',time(10),time(0),NOW).severity).toBe('soon');
    expect(countdownForAttestation('CURRENT',time(5),time(0),NOW).severity).toBe('urgent');
  });
  it('never calls an elapsed window current even if old server JSON says CURRENT',()=>{
    const c=countdownForAttestation('CURRENT',time(2),time(0),NOW+2*60000);
    expect(c).toMatchObject({severity:'expired',verifiedCurrent:false});
  });
  it('fails closed on stale snapshot, backwards device clock and malformed times',()=>{
    expect(countdownForAttestation('CURRENT',time(15),time(0),NOW+3*60000).verifiedCurrent).toBe(false);
    expect(countdownForAttestation('CURRENT',time(15),time(0),NOW-3*60000).text).toContain('clock');
    expect(countdownForAttestation('CURRENT','bad',time(0),NOW).severity).toBe('review');
  });
  it('refuses expired, missing and revoked attestations despite future expiry text',()=>{
    expect(countdownForAttestation('EXPIRED',time(15),time(0),NOW).verifiedCurrent).toBe(false);
    expect(countdownForAttestation('NOT_RECORDED',null,time(0),NOW).severity).toBe('none');
    expect(countdownForAttestation('REVOKED_OR_STALE',time(15),time(0),NOW).severity).toBe('review');
  });
  it('never counts the two offline signatures as approved before final activation',()=>{
    const result=guide(data());
    expect(result.steps.slice(0,2).map(s=>s.status)).toEqual(['offline','offline']);
    expect(result.steps.find(s=>s.id==='aal2')?.status).toBe('verified');
    expect(result.steps.find(s=>s.id==='self')?.status).toBe('verified');
    expect(result.steps.find(s=>s.id==='peer')?.status).toBe('verified');
    expect(result.steps.find(s=>s.id==='activate')?.status).toBe('pending');
    expect(result.peer.severity).toBe('urgent');
    expect(isOriginalActivationVerified(data())).toBe(false);
  });
  it('does not claim a matching intent when the user has not provided one',()=>{
    expect(guide(data(),false).steps.find(s=>s.id==='intent')?.status).toBe('pending');
  });
  it('does not validate an arbitrary typed hash without any matching attestation',()=>{
    const p=data();
    p.ownAttestation={state:'NOT_RECORDED',expiresAt:null};
    p.peerAttestation={state:'NOT_RECORDED',expiresAt:null};
    expect(guide(p,true).steps.find(s=>s.id==='intent')?.status).toBe('pending');
    expect(guide(p,true).steps.find(s=>s.id==='activate')?.status).toBe('pending');
  });
  it('requires receipt, one matching audit, two active memberships and HOLD for activation',()=>{
    const p=data();
    p.audit={activationRecorded:true,activationAt:time(-1),verifiedActivationEvents:1,lastVerifiedEventAt:time(-1)};
    p.ownerMembershipActive=true;p.activeOwnerMemberships=2;p.organizationEnrollmentState='VERIFIED';
    p.offlineApprovalState='VERIFIED_AT_ORIGINAL_ACTIVATION';
    expect(isOriginalActivationVerified(p)).toBe(true);
    expect(guide(p).steps.slice(0,2).every(s=>s.status==='verified')).toBe(true);
    p.audit.verifiedActivationEvents=0;
    expect(isOriginalActivationVerified(p)).toBe(false);
    expect(guide(p).stop).toBe(true);
    p.audit.verifiedActivationEvents=1;p.heldApplicationShells=5;
    expect(isOriginalActivationVerified(p)).toBe(false);
    expect(guide(p).stop).toBe(true);
  });
  it('never merges Ree and Jack roles or treats an absent readback as verified',()=>{
    const result=guide(null,true,'master');
    expect(result.steps.every(s=>s.status!=='verified')).toBe(true);
    expect(result.steps.find(s=>s.id==='peer')?.title).toContain('Ree');
    expect(result.steps.find(s=>s.id==='aal2')?.status).toBe('pending');
  });
  it('contains only generic shareable instructions and no account/evidence content',()=>{
    expect(SAFE_OWNER_HANDOFF).toContain('INSTRUCTIONS ONLY');
    expect(SAFE_OWNER_HANDOFF).toContain('not authorization');
    expect(SAFE_OWNER_HANDOFF).not.toMatch(/[a-f0-9]{64}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(SAFE_OWNER_HANDOFF).toContain('DISCONNECTED / HOLD');
  });
});
