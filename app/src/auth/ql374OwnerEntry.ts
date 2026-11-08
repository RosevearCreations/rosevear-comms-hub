import type {OwnerProgress} from './ql370OwnerProgress';

export type OwnerEntryRole='source'|'master';
export type OwnerEntrySection='home'|'sources'|'it'|'start';
export const OWNER_ENTRY_SECTIONS=[
  {id:'home',label:'My overview',description:'Personal session and safe first steps'},
  {id:'sources',label:'Six application shells',description:'Read-only identity and connection status'},
  {id:'it',label:'I.T. and security',description:'Protected six-app HOLD and enrollment readback'},
  {id:'start',label:'Getting started',description:'Guided navigation and safe help'}
] as const;

/** A browser can describe a *fresh protected readback*, never infer a grant
 * from login, MFA, an old preflight count or a local help position. */
export function ownerEntryTruth(args:{role:OwnerEntryRole;aal2:boolean;enrolled:boolean;
  progress:OwnerProgress|null;nowMs:number}){
  const {role,aal2,enrolled,progress,nowMs}=args;
  const snapshotAt=progress?Date.parse(progress.snapshotAt):NaN;
  const fresh=Number.isFinite(snapshotAt)&&Number.isFinite(nowMs)&&
    Math.abs(nowMs-snapshotAt)<=120000;
  const matching=Boolean(aal2&&progress&&progress.ownerRole===role&&
    progress.sessionAal2Verified&&progress.state==='ORIGINAL_OWNER_PROGRESS_READ_ONLY'&&fresh);
  const held=Boolean(matching&&progress?.connectionsState==='DISCONNECTED / HOLD'&&
    progress?.totalApplicationShells===6&&progress?.heldApplicationShells===6&&
    progress?.privateTestAuthorized===false);
  const auditConsistent=Boolean(progress&&(
    (progress.audit.activationRecorded&&progress.ownerMembershipActive&&
     progress.activeOwnerMemberships===2&&progress.organizationEnrollmentState==='VERIFIED')||
    (!progress.audit.activationRecorded&&!progress.ownerMembershipActive&&
     progress.activeOwnerMemberships===0&&progress.organizationEnrollmentState==='PENDING_VERIFIED_AUTH_USERS')));
  const drift=Boolean(matching&&(!held||!auditConsistent||
    progress!.ownerMembershipActive!==enrolled));
  const state=!aal2?'MFA_REQUIRED':!matching?'READBACK_REQUIRED':drift?'STOP_REVIEW':
    enrolled?'MEMBERSHIP_VERIFIED_HOLD':'PENDING_ENROLLMENT_HOLD';
  return {
    state,
    label:state==='MFA_REQUIRED'?'Finish personal MFA':
      state==='READBACK_REQUIRED'?'Protected readback not yet confirmed':
      state==='STOP_REVIEW'?'STOP — server truth needs investigation':
      state==='MEMBERSHIP_VERIFIED_HOLD'?'Owner membership verified; applications held':
      'Owner identity verified; membership not activated',
    held:held&&!drift,
    activeMemberships:matching&&!drift?progress!.activeOwnerMemberships:null,
    snapshotAt:matching?progress!.snapshotAt:null,
    mayEnterCustomerOperations:false as const,
    mayActivateSource:false as const
  };
}

export const QL374_HISTORICAL_PREREQUISITES=[
  {id:'ql329',label:'QL-329 master architecture marked PLANNED / no sessions',
    resolution:'Historical architecture fixture. The QL-367 identity portal now exists; its verified session does not grant a membership.'},
  {id:'ql331',label:'QL-331 zero Supabase Auth users at early preflight',
    resolution:'Historical count, not a current sign-in gate. Independently checked on 8 Nov 2026: 2 Auth users, 0 active owner memberships.'},
  {id:'ql307',label:'QL-307 six HTTP 404 / QL-309 NO-GO proof snapshots',
    resolution:'Archived software-era proof snapshots, not a fresh six-app source verdict. QL-365D software integration was promoted; live source authority remains separately held.'}
] as const;
export const QL374_REQUIRED_GATES=[
  'Each of us must establish our own Supabase Auth account and AAL2 authenticator session.',
  'Ree and Jack must independently sign genuine original-device owner decisions; only Ree submits one verified activation.',
  'Each application requires its own source-specific trust and explicit connection approval. All six remain DISCONNECTED / HOLD.'
] as const;
