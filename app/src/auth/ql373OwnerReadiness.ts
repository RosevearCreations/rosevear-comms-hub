import type {OwnerProgress} from './ql370OwnerProgress';
import {countdownForAttestation,isOriginalActivationVerified} from './ql371OwnerCeremony';
import type {OwnerRole} from './ql372OwnerResume';

/** Public, fixed documentation links. No user input, OAuth code, session or
 * intent hash is ever interpolated into a help URL. */
export const OWNER_HELP_LINKS = [
  {
    label:'QL-369 original-owner signing instructions',
    href:'https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-369_AUTHENTICATED_DUAL_OWNER_ENROLLMENT_CEREMONY.md'
  },
  {
    label:'QL-372 independent accessibility checklist',
    href:'https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-372_SUPERVISED_WALKTHROUGH_SCREENREADER_ACCEPTANCE_AND_SAFE_RESUME.md'
  },
  {
    label:'Supabase official authenticator MFA guidance',
    href:'https://supabase.com/docs/guides/auth/auth-mfa'
  }
] as const;

export type ReadinessIssue = {
  code:string;
  priority:'stop'|'action'|'review'|'verified';
  heading:string;
  explanation:string;
  nextAction:string;
  helpLink:typeof OWNER_HELP_LINKS[number]['href'];
};

const issue=(code:string,priority:ReadinessIssue['priority'],heading:string,
  explanation:string,nextAction:string,helpLink:ReadinessIssue['helpLink']):ReadinessIssue=>({
  code,priority,heading,explanation,nextAction,helpLink
});

/** QL-373 is an advisory decision tree; the QL-369 server is the only
 * enrollment authority. These labels can neither unlock nor sign anything. */
export function ownerReadinessIssue(args:{
  progress:OwnerProgress|null;
  mfaVerified:boolean;
  intentSupplied:boolean;
  ownerRole:OwnerRole;
  nowMs:number;
}):ReadinessIssue {
  const {progress,mfaVerified,intentSupplied,ownerRole,nowMs}=args;
  const signer=OWNER_HELP_LINKS[0].href;
  const mfaHelp=OWNER_HELP_LINKS[2].href;
  const accessibility=OWNER_HELP_LINKS[1].href;
  const activated=isOriginalActivationVerified(progress);
  if(progress && (
    progress.ownerRole!==ownerRole || progress.connectionsState!=='DISCONNECTED / HOLD' ||
    progress.totalApplicationShells!==6 || progress.heldApplicationShells!==6 ||
    progress.privateTestAuthorized ||
    ((progress.audit.activationRecorded || progress.activeOwnerMemberships>0 ||
      progress.organizationEnrollmentState==='VERIFIED') && !activated)
  ))return issue('STOP_REVIEW','stop','Stop and review the protected owner records',
    'The server snapshot contains a role, enrollment receipt or application HOLD inconsistency. A browser cannot repair it.',
    'Do not retry final activation. Independently investigate the original server records and signed packet.',signer);
  if(!mfaVerified)return issue('PERSONAL_MFA','action','Finish your own authenticator challenge',
    'A password, recovery email or another owner’s authentication is not enough for AAL2.',
    'Sign in as yourself on your own device; complete your own authenticator verification before refreshing status.',mfaHelp);
  if(!progress)return issue('READBACK_UNAVAILABLE','action','Protected progress is not available',
    'The server has not confirmed a usable owner-only status readback. No saved help position proves anything.',
    'Use Refresh server status. If it still fails, check the personal session and network without sharing credentials.',accessibility);
  const snapshot=Date.parse(progress.snapshotAt);
  if(!progress.sessionAal2Verified || progress.state!=='ORIGINAL_OWNER_PROGRESS_READ_ONLY' ||
    !Number.isFinite(snapshot) || !Number.isFinite(nowMs) || Math.abs(nowMs-snapshot)>120000){
    return issue('REFRESH_STATUS','action','Refresh an out-of-date or unverified status',
      'The protected readback is missing a current AAL2 confirmation or was captured more than two minutes from this device clock.',
      'Check the device clock, complete MFA if requested, then refresh protected server status.',mfaHelp);
  }
  if(activated)return issue('OWNER_VERIFIED_HELD','verified','Owner memberships verified; applications remain held',
    'Two genuine memberships and the original one-time activation audit are recorded. This still does not authorize application connections.',
    'Keep all six applications DISCONNECTED / HOLD until a separate source-specific approval is verified.',signer);
  if(!intentSupplied)return issue('MATCH_INTENT','action','Enter the original intent SHA-256',
    'The browser has not submitted a complete matching intent to the owner status readback. Typing a value is not proof of an original signature.',
    'On Ree’s original computer, review the QL-368 evidence and share its hash through the established trusted channel.',signer);
  const own=countdownForAttestation(progress.ownAttestation.state,
    progress.ownAttestation.expiresAt,progress.snapshotAt,nowMs);
  const peer=countdownForAttestation(progress.peerAttestation.state,
    progress.peerAttestation.expiresAt,progress.snapshotAt,nowMs);
  if(own.severity==='expired'||own.severity==='review')return issue('RENEW_OWN_MFA','action',
    'Renew or recheck your own intent-bound MFA',own.text,
    'Complete a fresh authenticator challenge and explicitly re-attest this intent if its original evidence remains valid.',mfaHelp);
  if(!own.verifiedCurrent)return issue('ATTEST_SELF','action','Record your own server-verified attestation',
    'No current matching attestation was established for this owner by the protected server readback.',
    'Use the QL-369 form to explicitly verify your own current AAL2 session against the matching intent.',mfaHelp);
  if(peer.severity==='expired'||peer.severity==='review')return issue('RENEW_PEER_MFA','action',
    'The other owner must renew or recheck MFA',peer.text,
    ownerRole==='source'?'Ask Jack to verify and attest independently on his own laptop. Never enter his MFA code.':
      'Ask Ree to verify and attest independently on her original computer. Never enter her MFA code.',mfaHelp);
  if(!peer.verifiedCurrent)return issue('WAIT_PEER','action',
    'Wait for the other owner’s independent attestation',
    'The protected server has not confirmed a matching, current attestation from both distinct owner accounts.',
    ownerRole==='source'?'Jack must complete his own MFA and intent-bound attestation on his laptop.':
      'Ree must complete her own MFA and intent-bound attestation on her original computer.',mfaHelp);
  if(own.severity==='urgent'||peer.severity==='urgent'||
    own.severity==='soon'||peer.severity==='soon')return issue('TIME_WINDOW','review',
    'MFA attestation window is closing',
    'The remaining time is a device-clock estimate; the server rechecks actual expiry. The offline 24-hour and one-hour signatures have separate limits.',
    'Review original evidence promptly; if any signature or attestation expires, regenerate it on the proper device.',signer);
  return issue('OFFLINE_REVIEW','review','Review original-device signatures separately',
    'Both MFA attestations appear current at the last server readback, but the browser cannot verify QL-368 evidence or two new QL-369 signed decisions.',
    ownerRole==='source'?'Ree alone must inspect the complete original packet and explicitly submit it for server verification.':
      'Jack must complete only his own original-device signing; Ree alone can submit the final packet.',signer);
}

export const ACCEPTANCE_CHECKS=[
  {id:'keyboard',label:'Keyboard navigation and step-heading focus'},
  {id:'screenreader',label:'Screen-reader labels and polite announcements'},
  {id:'readback',label:'Own MFA-protected server status refresh'},
  {id:'hold',label:'Six application HOLD restrictions remain visible'}
] as const;
export type AcceptanceId=typeof ACCEPTANCE_CHECKS[number]['id'];
export type AcceptanceResult='not_tested'|'worked'|'blocked';
export type AcceptanceAnswers=Record<AcceptanceId,AcceptanceResult>;
export type AcceptanceBlocker='none'|'account'|'authenticator'|'network'|'accessibility'|'original_device'|'unsure';

export const EMPTY_ACCEPTANCE:AcceptanceAnswers={
  keyboard:'not_tested',screenreader:'not_tested',readback:'not_tested',hold:'not_tested'
};
export const BLOCKER_OPTIONS:ReadonlyArray<{value:AcceptanceBlocker,label:string}>=[
  {value:'none',label:'No blocker observed'},
  {value:'account',label:'Personal account sign-in'},
  {value:'authenticator',label:'Authenticator or MFA challenge'},
  {value:'network',label:'Network or protected status readback'},
  {value:'accessibility',label:'Keyboard or screen reader'},
  {value:'original_device',label:'Original Windows signer or signed packet'},
  {value:'unsure',label:'Not sure yet'}
];

/** Only fixed, user-chosen *usability observations* leave the screen. No free
 * text, timestamps, hashes, signed evidence or server Auth state is exported. */
export function safeAcceptanceNote(role:OwnerRole,answers:AcceptanceAnswers,
  blocker:AcceptanceBlocker):string {
  const name=role==='source'?'Ree':'Jack';
  const resultLabels:Record<AcceptanceResult,string>={
    not_tested:'Not tested',worked:'Worked on this device (self-reported)',blocked:'Blocked on this device (self-reported)'
  };
  const block=BLOCKER_OPTIONS.find(x=>x.value===blocker)?.label??'Not sure yet';
  return [
    'ROSEVEAR CREATIONS — QL-373 INDEPENDENT TWO-DEVICE USABILITY NOTE',
    `Self-reported observer: ${name} (${role}); only this person can confirm these observations.`,
    'This is NOT identity verification, original-owner consent, a signature, MFA attestation or application approval.',
    ...ACCEPTANCE_CHECKS.map(c=>`${c.label}: ${resultLabels[answers[c.id]]??'Not tested'}`),
    `Blocker category (user selected): ${block}`,
    'No passwords, MFA codes, Auth tokens, original signer keys, intent hashes, signed packets, or server evidence are included.',
    'Ree and Jack must each perform and record a separate check on their own trusted computer.',
    'All six application shells remain DISCONNECTED / HOLD. No private TEST or connection is authorized.'
  ].join('\n');
}
