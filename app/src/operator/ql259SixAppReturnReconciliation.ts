/** QL-259: schema-only QL-258 owner handoff reconciliation. Never an authentication gate. */
import {QL258_APPS,QL258_OBSERVED,QL258_PROOF_PATH,QL258_RELEASE,
  QL258_STEPS,ql258SanitizedHandoff,type Ql258App,type Ql258Report}
  from './ql258OwnerActionChecklist';

export const QL259_RELEASE='ql259-offline-six-app-owner-return-reconciliation-source-drift-held-v1';
export const QL259_OBSERVED='29 October 2026';
export const QL259_LATEST_SOURCES=[
  {system:'ai-data-platform',sha:'24c54b189f41c2473dad58af9847a5c28dff0483'},
  {system:'devilndove',sha:'374308895f4f627e142de82d5460a17f5ab468e7'},
  {system:'rosiedazzlers',sha:'9cd4a14b85e1c64a30c76d01ac0c98aeb1970041'},
  {system:'yw',sha:'f52af07c7afc9f885991377de8969a508d6978ba'},
  {system:'icamp',sha:'461cc344c930578806f860702d74517c75038f0d'},
  {system:'rosevear-ai-hub',sha:'8d6faa77d7a44f8f97cd51d0acd209fe00b2c32c'}
] as const;

export type Ql259Entry=Readonly<{
  system:Ql258App;sourceShaFromQl258:string;
  progress:Ql258Report;newerSourceRequiresRecheck:boolean;
  disposition:'OWNER_PACKET_SCHEMA_ONLY_SOURCE_PROOF_AND_CUSTODY_HELD';
}>;
export type Ql259Ledger=Partial<Record<Ql258App,Ql259Entry>>;
export type Ql259IntakeResult=Readonly<{
  status:'ACCEPTED_SELF_REPORTED_HELD'|'REJECTED_UNSAFE_OR_INVALID_PACKET'|
    'DUPLICATE_IDENTICAL_NO_CHANGE_HELD'|'CONFLICT_REQUIRES_CLEAR_HELD';
  ledger:Ql259Ledger;system?:Ql258App;
}>;

function exactMatch(input:unknown,expected:unknown):boolean {
  if(input===expected)return true;
  if(input===null||expected===null||typeof input!=='object'||
    typeof expected!=='object'||Array.isArray(input)||Array.isArray(expected))return false;
  const i=input as Record<string,unknown>,e=expected as Record<string,unknown>;
  const keys=Object.keys(i),required=Object.keys(e);
  return keys.length===required.length&&keys.every(key=>
    Object.prototype.hasOwnProperty.call(e,key)&&exactMatch(i[key],e[key]));
}

export function inspectQl259Packet(input:unknown):Ql259Entry|null {
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const candidate=input as Record<string,unknown>;
  if(candidate.release!==QL258_RELEASE||typeof candidate.system!=='string')return null;
  const app=QL258_APPS.find(a=>a.system===candidate.system);
  if(!app)return null;
  const snapshot=candidate.publicGitHubSnapshot;
  if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return null;
  const source=snapshot as Record<string,unknown>;
  const report=candidate.ownerReportedUnverifiedProgress;
  if(!report||typeof report!=='object'||Array.isArray(report))return null;
  const progress=report as Ql258Report;
  let canonical:unknown;
  try{canonical=JSON.parse(ql258SanitizedHandoff(app.system,progress));}
  catch{return null;}
  if(!exactMatch(input,canonical)||source.mainSha!==app.mainSha||
    source.observed!==QL258_OBSERVED||source.requiredPath!==QL258_PROOF_PATH||
    source.httpStatusAtObservedSha!==404)return null;
  const updated=QL259_LATEST_SOURCES.find(a=>a.system===app.system);
  if(!updated||!QL258_STEPS.every(step=>typeof progress[step.key]==='string'))return null;
  return Object.freeze({system:app.system,sourceShaFromQl258:app.mainSha,
    progress:Object.freeze({...progress}),
    newerSourceRequiresRecheck:String(updated.sha)!==String(app.mainSha),
    disposition:'OWNER_PACKET_SCHEMA_ONLY_SOURCE_PROOF_AND_CUSTODY_HELD'});
}

export function intakeQl259Packet(ledger:Ql259Ledger,raw:string):Ql259IntakeResult {
  if(typeof raw!=='string'||raw.length>12000||raw.length===0)
    return {status:'REJECTED_UNSAFE_OR_INVALID_PACKET',ledger};
  let candidate:unknown;
  try{candidate=JSON.parse(raw);}catch{
    return {status:'REJECTED_UNSAFE_OR_INVALID_PACKET',ledger};
  }
  const entry=inspectQl259Packet(candidate);
  if(!entry)return {status:'REJECTED_UNSAFE_OR_INVALID_PACKET',ledger};
  const existing=ledger[entry.system];
  if(existing)return {status:exactMatch(existing,entry)
    ?'DUPLICATE_IDENTICAL_NO_CHANGE_HELD':'CONFLICT_REQUIRES_CLEAR_HELD',
    ledger,system:entry.system};
  return {status:'ACCEPTED_SELF_REPORTED_HELD',
    ledger:{...ledger,[entry.system]:entry},system:entry.system};
}

export function ql259Portfolio(ledger:Ql259Ledger){
  return QL258_APPS.map((app,i)=>{
    const entry=ledger[app.system];
    return {system:app.system,name:app.name,repository:app.repository,
      observedMainSha:QL259_LATEST_SOURCES[i].sha,publicProof:'HTTP_404',
      returnStatus:entry?'OWNER_SELF_REPORT_ACCEPTED_SCHEMA_ONLY_HELD':'NOT_RECEIVED',
      selfReportedDone:entry?QL258_STEPS.filter(step=>
        entry.progress[step.key]==='OWNER_REPORTS_DONE_NOT_VERIFIED').length:0,
      sourceRecheckRequired:entry?.newerSourceRequiresRecheck??true};
  });
}

export function ql259SanitizedPortfolio(ledger:Ql259Ledger):string {
  const rows=ql259Portfolio(ledger);
  return JSON.stringify({release:QL259_RELEASE,observed:QL259_OBSERVED,
    source:'PUBLIC_GITHUB_MAIN_IMMUTABLE_REFERENCE_ONLY',
    receivedSelfReportedPackets:rows.filter(r=>r.returnStatus!=='NOT_RECEIVED').length,
    portfolio:rows,
    independentCustodyAuthenticated:0,independentlyVerifiedPublicProofs:0,
    authenticatedOwnerTestApprovals:0,authenticatedGatewayGets:0,
    connectedApps:0,connection:'DISCONNECTED',livePilotHolds:12,
    disposition:'OFFLINE_OWNER_SELF_REPORTS_ONLY_NO_AUTHENTICATION_HELD'},null,2);
}
