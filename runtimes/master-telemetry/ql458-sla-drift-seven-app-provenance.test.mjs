import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl457ContinuityLedger} from './ql457-escalation-followthrough-reenrollment-recurrence.mjs';
import {SEVEN_APPS,openQl458ProvenanceLedger,readQl458Provenance,
 runQl458ProvenanceReview} from './ql458-sla-drift-seven-app-provenance.mjs';
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ROLES=['MASTER_CONTROLLER','MASTER_WITNESS','MASTER_COMMS','CAMPGROUND_SHELL',
 'WORKFORCE_SHELL','COMMERCE_COMPANY','DETAILING_COMPANY'];
const incidentId='ql458_original_incident_123456';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
function fixture({priorException=false,recoveryExpired=false,ceremonyExpired=false,reenrollmentPending=false,
 hostOn=false,witnessOn=false,recovered=true,lock=true,lease=true,watchdog=true,
 physicalIsolation=true,followupPending=false,recurrence=false,slowAck=false,staleOwner=false,
 oldCase=false,ceremonyDrift=false,deniedApp=false,priorRecurrence=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ql458-')),now=Date.now()-500;
 const ql457Ledger=openQl457ContinuityLedger(join(root,'ql457'));
 const provenanceLedger=openQl458ProvenanceLedger(join(root,'ql458'));
 const pending=ql457Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const priorOutcome=ql457Ledger.claimOnce(priorException?'exception':'review',incidentId,'b'.repeat(64));
 const prior={state:priorException?'DURABLE_QL457_FOLLOWUP_RECURRENCE_EXCEPTION_OPEN':
  'DURABLE_QL457_FOLLOWUP_CONTINUITY_REVIEW_ONLY',
  originalIncidentId:incidentId,monitorId:'ql457_prior_monitor_123456',
  challengeNonce:'ql457_prior_nonce_123456',
  classification:priorException?'SIGNED_RECURRENCE_OR_REENROLLMENT_EXPIRY_EXCEPTION_OPEN':
    'SIGNED_ESCALATION_FOLLOWUP_AND_REENROLLMENT_CONTINUITY_REVIEW_ONLY',
  closureDecision:priorException?'ESCALATE_FOLLOWUP_OR_REENROLLMENT_RECURRENCE_KEEP_OPEN_HOLD':
    'RENEW_THREE_MASTER_CLOSURE_EVIDENCE_CONTINUITY_KEEP_OPEN_HOLD',
  connection:'HOLD',incidentStatus:'OPEN',activationAuthorized:false,closureAuthorized:false,
  physicalReceiverCurrentlyOff:false,masterCount:3,
  recoveryExpiredAtReview:priorException,ceremonyAuthorityExpiredAtReview:priorException,
  followUpStatus:'SIGNED_FOLLOWUP_ACKNOWLEDGED_OPEN_HOLD',
  recurrenceCount:priorRecurrence?1:0,reEnrollmentGeneration:2,
  ownerAcceptance:'DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD',
  pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:priorOutcome.recordDigest,
  monitorDigest:'c'.repeat(64),gateDigest:'d'.repeat(64),reportsDigest:'e'.repeat(64)};
 const monitorId='ql458_monitor_abc123456',challengeNonce='ql458_nonce_abcde12345';
 const keys={source:key(),recovery:key(),host:key(),anchor:key(),witness:key(),
  ceremony:key(),gate:key(),owner:key(),masterOwner:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const p={schema:'rosevear.ql458.original-ql457-case.v1',
  incidentId,ql457SummaryDigest:digest(prior),ql457ReceiptDigest:priorOutcome.recordDigest,
  ql457MonitorDigest:prior.monitorDigest,incidentStatus:'OPEN_HOLD',
  readAt:iso(now-12000)};
 const r={schema:'rosevear.ql458.independent-recovery-outcome.v1',
  incidentId,monitorId,challengeNonce,ql457ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryStatus:recovered?'ESCALATION_OUTCOME_ATTESTED_OPEN_HOLD':'UNRESOLVED_OPEN_HOLD',
  followUpCaseId:'ql458_followup_abc12345',followUpEvidenceDigest:'9'.repeat(64),
  followUpStatus:followupPending?'FOLLOWUP_PENDING_OPEN_HOLD':'SIGNED_FOLLOWUP_ACKNOWLEDGED_OPEN_HOLD',
  followUpAcknowledgedAt:iso(now-11200),
  followUpOpenedAt:iso(now-(oldCase?90000000:staleOwner?10800000:slowAck?360000:11900)),
  lastOwnerResponseAt:iso(now-(staleOwner?7200000:oldCase?20000:11200)),
  sourceEscalationDigest:prior.monitorDigest,
  recoveryIssuedAt:iso(now-11500),
  recoveryExpiresAt:iso(now+(recoveryExpired?-100:10000)),
  signedAt:iso(now-11000)};
 const h={schema:'rosevear.ql458.original-host-off-review.v1',
  incidentId,monitorId,challengeNonce,ql457ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryDigest:digest(r),originalHostId:'DESKTOP-AE894KC',
  hostReceiverState:hostOn?'ON':'OFF',isolationLock:lock,leaseRevoked:lease,
  watchdogArmed:watchdog,hostSequence:100,observedAt:iso(now-10000)};
 const a={schema:'rosevear.ql458.independent-freshness-anchor.v1',
  incidentId,monitorId,challengeNonce,ql457ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorId:'ql458_external_anchor_abc12345',anchorSequence:101,
  anchorDisposition:'HISTORICAL_MONITOR_ONLY_OPEN_HOLD',anchoredAt:iso(now-9000)};
 const originalSensorId='ql457_original_sensor_12345';
 const w={schema:'rosevear.ql458.physical-recurrence-witness.v1',
  incidentId,monitorId,challengeNonce,ql457ReceiptDigest:priorOutcome.recordDigest,
  anchorDigest:digest(a),recoveryDigest:digest(r),hostDigest:digest(h),
  originalHostId:'DESKTOP-AE894KC',receiverId:'ISOLATED_COMMS_RECEIVER',
  sensorId:'ql458_new_sensor_abc12345',originalSensorId,
  receiverState:witnessOn?'ON':'OFF',isolationConfirmed:physicalIsolation,
  previousObserverSequence:102,observerSequence:103,
  recurrenceCount:recurrence?1:0,recurrenceWindowStart:iso(now-16000),
  recurrenceWindowEnd:iso(now-3000),observedAt:iso(now-3000)};
 const c={schema:'rosevear.ql458.historical-ceremony-authority.v1',
  incidentId,monitorId,ql457ReceiptDigest:priorOutcome.recordDigest,
  recoveryDigest:digest(r),ceremonyId:'ql458_historical_ceremony_12345',
  issuedAt:iso(now-10500),expiresAt:iso(now+(ceremonyExpired?-100:10000)),
  previousCeremonyId:'ql457_old_ceremony_12345',
  reEnrollmentStatus:reenrollmentPending?'PENDING_REENROLLMENT_OPEN_HOLD':'REENROLLED_REVIEW_ONLY',
  enrollmentRecordDigest:'1'.repeat(64),
  priorEnrollmentDigest:'f'.repeat(64),reEnrollmentGeneration:3,
  challengeNonce,challengeDigest:digest({incidentId,monitorId,challengeNonce,
    prior:priorOutcome.recordDigest,priorEnrollmentDigest:'f'.repeat(64)}),
  issuerClockDriftMs:ceremonyDrift?50000:0,
  enrollmentWitnessDigest:'2'.repeat(64),observedAt:iso(now-900),
  authorityDecision:'REENROLLED_HISTORICAL_READINESS_ONLY_NO_CLOSURE',
  incidentStatus:'OPEN_HOLD',closureAuthorized:false,
  activationAuthorized:false,physicalReceiverCurrentlyOff:false};
 const appKeys=Object.fromEntries(SEVEN_APPS.map(a=>[a,key()]));
 const expectedMainShas=Object.fromEntries(SEVEN_APPS.map((a,i)=>[a,(i+1).toString(16).repeat(40)]));
 const controllerSha=expectedMainShas['ai-data-platform'];
 const manifestPayloads=SEVEN_APPS.map((a,i)=>({
  schema:'rosevear.ql458.app-source-provenance.v1',incidentId,monitorId,challengeNonce,
  priorReceiptDigest:priorOutcome.recordDigest,appId:a,repoFullName:'RosevearCreations/'+a,
  role:ROLES[i],topologyId:'rosevear-master-shell-seven-apps.v1',controllerSha,
  mainSha:expectedMainShas[a],sourceManifestDigest:(i+1).toString(16).repeat(64),
  sourceSignerId:'ql458_source_signer_'+i+'_abc123',sourceReadAt:iso(now-1200),
  runtimeConnection:'UNVERIFIED_HOLD',authorityTransfer:false,privilegedScope:false,
  tenantBoundary:'ISOLATED_READ_ONLY',
  sourceStatus:deniedApp&&i===4?'SOURCE_DENIED':'SOURCE_SIGNED_HELD'}));
 const manifests=manifestPayloads.map((m,i)=>signed(m,appKeys[m.appId]));
 const sourceManifestDigest=digest(manifestPayloads);
 const SLA={followUp5m:slowAck,ownerResponse1h:staleOwner,followUp24h:oldCase};
 const slaEscalated=Object.values(SLA).some(Boolean);
 const health=!priorException&&!recoveryExpired&&!ceremonyExpired&&!reenrollmentPending&&
  !slaEscalated&&!ceremonyDrift&&!deniedApp&&!priorRecurrence&&
  !followupPending&&!recurrence&&
  !hostOn&&!witnessOn&&
  recovered&&lock&&lease&&watchdog&&physicalIsolation;
 const classification=health?'SIGNED_MULTIHORIZON_SLA_CEREMONY_AND_SEVEN_APP_SOURCE_REVIEW_ONLY':
  'SIGNED_SLA_DRIFT_OR_SEVEN_APP_SOURCE_EXCEPTION_OPEN';
 const closureDecision=health?'RENEW_THREE_MASTER_SOURCE_PROVENANCE_KEEP_OPEN_HOLD':
  'ESCALATE_SLA_OR_SOURCE_DRIFT_KEEP_OPEN_HOLD';
 const monitorDigest=digest({ql457SummaryDigest:digest(prior),monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorDigest:digest(a),witnessDigest:digest(w),ceremonyDigest:digest(c),
  recoveryExpired,ceremonyExpired,recurrenceCount:w.recurrenceCount,
  followUpStatus:r.followUpStatus,reEnrollmentGeneration:c.reEnrollmentGeneration,
  sourceManifestDigest,sourceCount:manifestPayloads.length,deniedCount:deniedApp?1:0,
  slaBands:SLA,ceremonyDrifted:ceremonyDrift,classification});
 const g={schema:'rosevear.ql458.independent-ceremony-expiry-gate.v1',
  incidentId,monitorId,ql457ReceiptDigest:priorOutcome.recordDigest,
  monitorDigest,classification,closureDecision,incidentStatus:'OPEN_HOLD',
  closureAuthorized:false,activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  separateCeremonyRequired:true,attestedAt:iso(now-2000)};
 const gateDigest=digest(g);
 const votes=MASTERS.map(masterId=>({
  schema:'rosevear.ql458.three-master-expiry-review.v1',
  incidentId,monitorId,masterId,ql457ReceiptDigest:priorOutcome.recordDigest,
  monitorDigest,gateDigest,classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-1500)}));
 const owner={schema:'rosevear.ql458.dual-owner-expiry-review.v1',
  incidentId,monitorId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql457ReceiptDigest:priorOutcome.recordDigest,monitorDigest,gateDigest,
  masterReportsDigest:digest(votes),classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-1000)};
 const env={source:signed(p,keys.source),recovery:signed(r,keys.recovery),
  host:signed(h,keys.host),anchor:signed(a,keys.anchor),witness:signed(w,keys.witness),
  ceremony:signed(c,keys.ceremony),gate:signed(g,keys.gate),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  manifests,
  owners:{payload:owner,sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.masterOwner).signature}};
 const args={ql457Summary:prior,ql457Ledger,provenanceLedger,monitorId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl457Case:async()=>env.source},
  independentRecoveryProvider:{readSignedRecoveryOutcome:async()=>env.recovery},
  originalHostProvider:{readSignedOriginalHostOffReview:async()=>env.host},
  independentAnchorProvider:{readSignedProvenanceAnchor:async()=>env.anchor},
  independentPhysicalProvider:{readSignedPhysicalRecurrenceWitness:async()=>env.witness},
  ceremonyAuthorityProvider:{readSignedHistoricalCeremonyAuthority:async()=>env.ceremony},
  independentGateProvider:{readSignedIndependentProvenanceGate:async()=>env.gate},
  threeMasterProvider:{readSignedCeremonyExpiryVotes:async()=>env.votes},
  sevenAppProvider:{readSignedSevenAppProvenance:async()=>env.manifests},
  finalOwnerDecision:env.owners};
 const opts={nowMs:now,readTrustedNowMs:()=>opts.nowMs,
  trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl457CustodyVerified:true,physicalSensorEnrollmentVerified:true,
  independentSignerPinsVerified:true,separateOwnerRolesVerified:true,
  independentlyPinnedSevenAppSourcesVerified:true,expectedMainShas,controllerSha,
  appPins:Object.fromEntries(SEVEN_APPS.map(a=>[a,appKeys[a].pin])),
  originalSensorId,priorCeremonyId:'ql457_old_ceremony_12345',priorEnrollmentDigest:'f'.repeat(64),commsSourcePin:keys.source.pin,recoveryOfficerPin:keys.recovery.pin,
  originalHostPin:keys.host.pin,externalAnchorPin:keys.anchor.pin,
  physicalObserverPin:keys.witness.pin,ceremonyAuthorityPin:keys.ceremony.pin,
  independentGatePin:keys.gate.pin,sourceOwnerPin:keys.owner.pin,
  masterOwnerPin:keys.masterOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return{root,now,prior,ql457Ledger,provenanceLedger,monitorId,challengeNonce,
  p,r,h,a,w,c,g,votes,owner,keys,env,args,opts,appKeys,manifestPayloads,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.owner).signature,
   masterOwnerSignature:signed(v,keys.masterOwner).signature};},
  run:()=>runQl458ProvenanceReview(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(change,reason,config={}){
 const f=fixture(config);try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL458 independent signed recovery, physical OFF and historical authority yield review only OPEN/HOLD',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL458_SEVEN_APP_PROVENANCE_REVIEW_ONLY');
  assert.equal(r.masterCount,3);assert.equal(r.ceremonyAuthorityExpiredAtReview,false);
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);assert.equal(r.connection,'HOLD');
  assert.equal(readQl458Provenance(f.provenanceLedger,incidentId).state,
   'QL458_DURABLE_SEVEN_APP_PROVENANCE_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL458_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
 }finally{f.cleanup();}
});
test('QL458 signed recovery expiry, ceremony authority expiry, physical ON and host-control recurrence escalate',async()=>{
 for(const config of [{recoveryExpired:true},{ceremonyExpired:true},{reenrollmentPending:true},{followupPending:true},{recurrence:true},
  {slowAck:true},{staleOwner:true},{oldCase:true},{ceremonyDrift:true},{deniedApp:true},
  {priorRecurrence:true},{hostOn:true},
  {witnessOn:true},{lock:false},{lease:false},{watchdog:false},
  {physicalIsolation:false},{recovered:false},{priorException:true}]){
  const f=fixture(config);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL458_SLA_OR_PROVENANCE_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_SLA_DRIFT_OR_SEVEN_APP_SOURCE_EXCEPTION_OPEN');
   assert.equal(r.closureAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
   assert.equal(readQl458Provenance(f.provenanceLedger,incidentId).state,
    'QL458_DURABLE_SLA_OR_PROVENANCE_EXCEPTION_OPEN');
  }finally{f.cleanup();}
 }
});
test('QL458 validates original QL457 private custody, holder nonce and twelve separate signer pins',async()=>{
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},'QL458_EXACT_QL457_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.prior.finalReceiptDigest='f'.repeat(64);},'QL458_EXACT_QL457_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},'QL458_EXACT_QL457_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.opts.appPins['yw']=f.opts.appPins['iCamp'];},'QL458_NINETEEN_DISTINCT_SIGNER_PINS_OR_PINNED_SHA_REQUIRED');
 await rejected(f=>{f.opts.originalHostPin=f.opts.physicalObserverPin;},'QL458_NINETEEN_DISTINCT_SIGNER_PINS_OR_PINNED_SHA_REQUIRED');
});
test('QL458 original source, recovery provenance, expiry interval and Ed25519 must verify',async()=>{
 await rejected(f=>{f.env.source.payload.incidentStatus='CLOSED';},'QL458_ORIGINAL_SIGNED_CASE_INVALID');
 await rejected(f=>{f.env.recovery=signed({...f.r,recoveryStatus:'CLOSED'},f.keys.recovery);},
  'QL458_SIGNED_RECOVERY_OUTCOME_INVALID');
 await rejected(f=>{f.env.recovery=signed({...f.r,
  recoveryExpiresAt:iso(f.now-50000)},f.keys.recovery);},
  'QL458_SIGNED_RECOVERY_OUTCOME_INVALID');
 await rejected(f=>{f.env.recovery=signed({...f.r,sourceEscalationDigest:'a'.repeat(64)},f.keys.recovery);},
  'QL458_SIGNED_RECOVERY_OUTCOME_INVALID');
 await rejected(f=>{f.env.recovery=signed({...f.r,followUpStatus:'CLOSED'},f.keys.recovery);},
  'QL458_SIGNED_RECOVERY_OUTCOME_INVALID');
 await rejected(f=>{f.env.recovery.signature=f.env.source.signature;},
  'QL458_SIGNED_RECOVERY_OUTCOME_INVALID');
});
test('QL458 original Windows host, independent anchor, recurrence sensor and witness age are scoped and signed',async()=>{
 await rejected(f=>{f.env.host=signed({...f.h,originalHostId:'TEMPLAR'},f.keys.host);},
  'QL458_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.env.anchor=signed({...f.a,hostDigest:'f'.repeat(64)},f.keys.anchor);},
  'QL458_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 await rejected(f=>{f.env.witness=signed({...f.w,observedAt:iso(f.now-16000)},f.keys.witness);},
  'QL458_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.env.witness=signed({...f.w,sensorId:f.opts.originalSensorId},f.keys.witness);},
  'QL458_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.env.witness=signed({...f.w,previousObserverSequence:103},f.keys.witness);},
  'QL458_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.env.witness=signed({...f.w,recurrenceWindowStart:iso(f.now-5000)},f.keys.witness);},
  'QL458_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.env.witness=signed({...f.w,receiverId:'WRONG_RECEIVER'},f.keys.witness);},
  'QL458_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
});
test('QL458 historical ceremony authority can expire, but cannot permit closure or activation',async()=>{
 await rejected(f=>{f.env.ceremony=signed({...f.c,previousCeremonyId:'INVALID_OLD'},f.keys.ceremony);},'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,ceremonyId:f.opts.priorCeremonyId},f.keys.ceremony);},'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,priorEnrollmentDigest:'e'.repeat(64)},f.keys.ceremony);},
  'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,reEnrollmentGeneration:1},f.keys.ceremony);},
  'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,challengeDigest:'e'.repeat(64)},f.keys.ceremony);},
  'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,reEnrollmentGeneration:2},f.keys.ceremony);},
  'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,closureAuthorized:true},f.keys.ceremony);},
  'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,authorityDecision:'AUTHORIZE_ON'},f.keys.ceremony);},
  'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,expiresAt:iso(f.now-50000)},f.keys.ceremony);},
  'QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
});
test('QL458 rejects seven-app missing, out-of-order, forged pins, stale source, privilege escalation and cross-tenant drift',async()=>{
 await rejected(f=>{f.env.manifests.pop();},'QL458_SEVEN_DISTINCT_SIGNED_APP_SOURCES_REQUIRED');
 await rejected(f=>{[f.env.manifests[3],f.env.manifests[4]]=[f.env.manifests[4],f.env.manifests[3]];},
  'QL458_SEVEN_APP_IDENTITY_SCHEMA_PRIVILEGE_OR_PIN_VETO');
 await rejected(f=>{f.env.manifests[6].signature=f.env.manifests[0].signature;},
  'QL458_SEVEN_APP_IDENTITY_SCHEMA_PRIVILEGE_OR_PIN_VETO');
 await rejected(f=>{f.env.manifests[4]=signed({...f.manifestPayloads[4],privilegedScope:true},f.appKeys['yw']);},
  'QL458_SEVEN_APP_IDENTITY_SCHEMA_PRIVILEGE_OR_PIN_VETO');
 await rejected(f=>{f.env.manifests[3]=signed({...f.manifestPayloads[3],mainSha:'f'.repeat(40)},f.appKeys.iCamp);},
  'QL458_SEVEN_APP_IDENTITY_SCHEMA_PRIVILEGE_OR_PIN_VETO');
 await rejected(f=>{f.env.manifests[1]=signed({...f.manifestPayloads[1],tenantBoundary:'SHARED'},f.appKeys['rosevear-ai-hub']);},
  'QL458_SEVEN_APP_IDENTITY_SCHEMA_PRIVILEGE_OR_PIN_VETO');
 await rejected(f=>{f.env.manifests[2]=signed({...f.manifestPayloads[2],sourceReadAt:iso(f.now-65000)},f.appKeys['rosevear-comms-hub']);},
  'QL458_SEVEN_APP_IDENTITY_SCHEMA_PRIVILEGE_OR_PIN_VETO');
});
test('QL458 independent gate, three Master votes and both owners cannot override OPEN/HOLD',async()=>{
 await rejected(f=>{f.env.gate=signed({...f.g,closureAuthorized:true},f.keys.gate);},
  'QL458_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 await rejected(f=>{f.env.gate=signed({...f.g,physicalReceiverCurrentlyOff:true},f.keys.gate);},
  'QL458_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 await rejected(f=>{f.env.votes.pop();},'QL458_THREE_DISTINCT_MASTERS_REQUIRED');
 await rejected(f=>{f.env.votes[1]=f.env.votes[0];},'QL458_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.env.votes[2]=signed({...f.votes[2],
  closureDecision:'CLOSE_AND_CONNECT'},f.keys.masters[MASTERS[2]]);},
  'QL458_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL458_DUAL_OWNER_EXPIRY_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},'QL458_DUAL_OWNER_EXPIRY_VETO');
});
test('QL458 independent final clock prevents accepting expired recovery/authority and stale physical witness',async()=>{
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+22000;},
  'QL458_PROTECTED_CUSTODY_OR_SOURCE_FRESHNESS_EXPIRED');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+11000;},
  'QL458_FOLLOWUP_OR_REENROLLMENT_EXPIRED_DURING_REVIEW');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now-1;},'QL458_TRUSTED_CLOCK_DRIFT');
});
test('QL458 interrupted external source read leaves immutable pending and no silent rerun',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl457Case=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL458_ORIGINAL_CASE_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL458_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
  assert.equal(readQl458Provenance(f.provenanceLedger,incidentId).reason,
   'QL458_PENDING_MANUAL_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL458 corrupted private custody and unsafe directory reject intake',async()=>{
 const f=fixture();try{
  f.provenanceLedger.claimOnce('pending',incidentId,'f'.repeat(64));
  writeFileSync(join(f.root,'ql458','ql458-pending-'+incidentId+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL458_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl458Provenance(f.provenanceLedger,incidentId).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl458ProvenanceLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
