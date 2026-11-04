import {QL331_PUBLIC_SOURCES} from './ql331MasterAccess';

/**
 * Nonsecret release readback only. This public model cannot receive a secret
 * handle, resolve Vault, rotate a key, or make a request to a peer.
 */
export const QL332_PREFLIGHT = {
  observedDate:'2026-11-04',
  selectedRegistry:'gxujcwpktaickcgzyvnu',
  vaultExtensionObserved:'0.3.1',
  enrolledWorkloads:0,
  pinnedVerifiedIssuers:0,
  managedHandles:0,
  rotationJobs:0,
  custodyReceipts:0,
  ownerAuthUsersAtPreflight:0,
  sourceConnections:0,
  windowsRelay:'OFF',
  ack:'UNDER_REVIEW / PARKED_FOR_LATER'
} as const;

export const QL332_BOOTSTRAP_STEPS=[
  {id:'owner',label:'Verified, enrolled master owner + independent authorization',state:'MISSING'},
  {id:'workload',label:'Attested private broker workload identity, short-lived trust',state:'MISSING'},
  {id:'vault',label:'Approved managed provider, private key access and recovery runbook',state:'PROVIDER_SELECTED / NO KEYS'},
  {id:'issuer',label:'Original signed source Proof-B, pinned public issuer key and custodian',state:'MISSING'},
  {id:'grant',label:'Exact source-owner + owner signed read-only TEST permission',state:'MISSING'},
  {id:'rotate',label:'Two-sided dual-key verification and append-only receipts before cutover',state:'ENGINE READY / NOT RUNNING'}
] as const;

export type Ql332Check='fingerprint'|'rotation'|'emergency'|'child'|'source';
export type Ql332Decision={
  verdict:'HOLD_UNKNOWN_SHELL'|'HOLD_ISSUER_UNVERIFIED'|'HOLD_NO_MANAGED_KEY'|
    'HOLD_MISSING_SOURCE_AUTHORITY'|'HOLD_NO_CHILD_AUTHORITY'|'HOLD_NO_PRIVATE_WORKLOAD';
  detail:string;keyReads:0;sourceCalls:0;enrolledKeys:0;permissionsAdded:0;
};
const noAccess=(verdict:Ql332Decision['verdict'],detail:string):Ql332Decision=>({
  verdict,detail,keyReads:0,sourceCalls:0,enrolledKeys:0,permissionsAdded:0
});
export function ql332ReviewGate(shellId:string,check:Ql332Check):Ql332Decision{
  const source=QL331_PUBLIC_SOURCES.find(item=>item.id===shellId);
  if(!source)return noAccess('HOLD_UNKNOWN_SHELL','Unknown or child-level connector identity is rejected.');
  if(check==='child')return noAccess('HOLD_NO_CHILD_AUTHORITY',
    source.kind==='support'
      ? 'Supporting systems are never customer child tenants.'
      : 'A shell key cannot grant access to a child. Source-owned child identity and a separate grant are missing.');
  if(check==='source')return noAccess('HOLD_MISSING_SOURCE_AUTHORITY',
    'No original source Proof-B and explicit owner/source-owner TEST authorization has been independently verified.');
  if(check==='fingerprint')return noAccess('HOLD_ISSUER_UNVERIFIED',
    'No source-owned public issuer fingerprint is independently pinned. An untrusted replacement key is rejected.');
  if(check==='emergency')return noAccess('HOLD_NO_PRIVATE_WORKLOAD',
    'Only an attested private broker may revoke a verified scoped handle. The public UI has no emergency key action.');
  return noAccess('HOLD_NO_MANAGED_KEY',
    'Vault is installed, but no approved key handle, dual-key window or executable rotation job is enrolled.');
}
export function ql332ReleaseReadiness(){
  return {
    sources:QL331_PUBLIC_SOURCES.length,
    businessShells:QL331_PUBLIC_SOURCES.filter(x=>x.kind==='business').length,
    supportingServices:QL331_PUBLIC_SOURCES.filter(x=>x.kind==='support').length,
    allHeld:QL331_PUBLIC_SOURCES.every(x=>x.status==='DISCONNECTED / HOLD'),
    ...QL332_PREFLIGHT,
    custodyStatus:'KEY CUSTODY HOLD',
    softwareStatus:'QL-332 CONTROL DESIGN / CLOSED ENROLMENT',
    externalKeyReads:0,
    externalWrites:0
  } as const;
}
