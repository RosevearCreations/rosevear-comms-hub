/**
 * QL-477 original-host installation/recovery evidence and secure first telemetry review.
 * PURE reviewers: NO file I/O, network access, service installation, or live activation.
 * Signed packets are corroborated claims, not independent physical host evidence.
 */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';

export const QL477_FIELD='rosevear.comms.ql477.original-host-evidence.v1';
export const QL477_TELEMETRY='rosevear.comms.ql477.sysop-telemetry.v1';
export const QL477_OWNER='rosevear.comms.ql477.install-owner.v1';
export const QL477_OBSERVER='rosevear.comms.ql477.install-observer.v1';
export const QL477_SIGNED_SAMPLE='rosevear.comms.ql477.signed-sysop-sample.v1';
export const QL477_SIGNED_ACK='rosevear.comms.ql477.signed-readonly-ack.v1';

const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const HOST='DESKTOP-AE894KC',TASK='Rosevear-CommsHub-Worker',SRC='rosevear-comms-hub';
const digest=obj=>createHash('sha256').update(JSON.stringify(obj)).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const fresh=(a,now)=>Number.isSafeInteger(a)&&Number.isSafeInteger(now)&&a<=now&&now-a<=300000;
const exact=(obj,fields)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).length===fields.length&&fields.every(k=>Object.hasOwn(obj,k));
const held=(reason,more={})=>Object.freeze({state:'HOLD',reason,installedOnOriginalHostCertified:false,
  independentPhysicalRecoveryCertified:false,liveTransportCertified:false,firstTelemetryAccepted:false,
  receiverEnabled:false,peerSent:false,autoStart:false,rebootAuthorized:false,sourceDeletions:0,...more});

const installFields=['schema','host','mainSha','exportId','taskName','onDemandOnly','interactiveOwnerOnly',
 'workerScriptSha256','receiverPort8788Listeners','legacyTaskDisabled','serviceAutostartEnabled',
 'taskLastResult','sourceClean','sourceDeletions','receiverActivated','peerSent','rebootPerformed'];
const fieldFields=['schema','host','mainSha','exportId','observedAtMs','install','first','recovery','firstFileSha256',
 'recoveryFileSha256','telemetry','offlineBackupReviewed','independentlyWitnessed','sourceDeletions'];
const sampleFields=['schema','host','sourceApp','sourceMainSha','workerScriptSha256','sampleId',
 'osBootId','observedAtMs','uptimeSeconds','processCount','dataClass','customerDataIncluded',
 'authorizesAction','receiverActivated','peerSent'];
const ownerFields=['schema','host','mainSha','fieldDigest','issuedAtMs','expiresAtMs','scope',
 'offlineBackupPersonallyVerified','installPersonallyWitnessed','recoveryPersonallyWitnessed',
 'automaticStart','receiverEnable','rebootAuthorization','authorityTransfer'];
const witnessFields=['schema','host','mainSha','fieldDigest','observedAtMs','independentObserver',
 'originalHostSeen','taskActionVerified','offlineRestoreSeen','firstReceiptSeen',
 'recoveryReceiptSeen','sourceIntact','authorityTransfer'];
const ackFields=['schema','issuer','audience','sourceApp','messageId','sampleDigest',
 'receivedAtMs','disposition','persistentReadBack','authorityTransfer'];
const outboundFields=['schema','issuer','audience','messageId','sampleDigest','issuedAtMs',
 'expiresAtMs','dataClass','authorityTransfer'];

export function reviewQl477FieldBundle({report,expectedMainSha,nowMs=Date.now()}={}){
 if(!SHA.test(expectedMainSha??'')||report?.schema!==QL477_FIELD||
   report.host!==HOST||report.mainSha!==expectedMainSha||!UUID.test(report.exportId??'')||
   !fresh(report.observedAtMs,nowMs)||report.offlineBackupReviewed!==false||
   report.independentlyWitnessed!==false||report.sourceDeletions!==0||
   !exact(report,fieldFields))return held('QL477_CURRENT_ORIGINAL_HOST_EVIDENCE_REQUIRED');
 const i=report.install;
 if(!exact(i,installFields)||i.schema!=='rosevear.comms.ql477.install-snapshot.v1'||
   i.host!==HOST||i.mainSha!==expectedMainSha||i.exportId!==report.exportId||
   i.taskName!==TASK||i.onDemandOnly!==true||i.interactiveOwnerOnly!==true||
   !HEX.test(i.workerScriptSha256??'')||i.receiverPort8788Listeners!==0||
   i.legacyTaskDisabled!==true||i.serviceAutostartEnabled!==false||
   i.taskLastResult!==0||i.sourceClean!==true||i.sourceDeletions!==0||
   i.receiverActivated!==false||i.peerSent!==false||i.rebootPerformed!==false)
    return held('QL477_INSTALL_TASK_AND_RECEIVER_OFF_SNAPSHOT_INVALID');
 const f=report.first,r=report.recovery,t=report.telemetry;
 for(const a of [f,r]){
   if(a?.schema!=='rosevear.comms.ql476.local-run.v1'||a.host!==HOST||
    a.mainSha!==expectedMainSha||a.workerScriptHash!==i.workerScriptSha256||
    !UUID.test(a.runId??'')||!UUID.test(a.osBootId??'')||
    !Number.isSafeInteger(a.observedAtMs)||a.observedAtMs>report.observedAtMs||
    !Number.isSafeInteger(a.processCount)||a.processCount<1||a.processCount>250000||
    !Number.isSafeInteger(a.uptimeSeconds)||a.uptimeSeconds<0||
    a.receiverPort8788Listeners!==0||a.peerSent!==false)
    return held('QL477_CORRUPT_OR_MISMATCHED_RUN_RECEIPT');
 }
 if(f.runId===r.runId||f.observedAtMs>=r.observedAtMs||
    f.osBootId!==r.osBootId||r.observedAtMs>report.observedAtMs||
    !HEX.test(report.firstFileSha256??'')||!HEX.test(report.recoveryFileSha256??'')||
    equal(report.firstFileSha256,report.recoveryFileSha256))
    return held('QL477_REPLAYED_OR_UNORDERED_RECOVERY');
 if(!exact(t,sampleFields)||t.schema!==QL477_TELEMETRY||t.host!==HOST||
    t.sourceApp!==SRC||t.sourceMainSha!==expectedMainSha||
    t.workerScriptSha256!==i.workerScriptSha256||t.sampleId!==r.runId||
    t.osBootId!==r.osBootId||t.observedAtMs!==r.observedAtMs||
    t.uptimeSeconds!==r.uptimeSeconds||t.processCount!==r.processCount||
    t.dataClass!=='NON_SENSITIVE_AGGREGATE'||t.customerDataIncluded!==false||
    t.authorizesAction!==false||t.receiverActivated!==false||t.peerSent!==false)
    return held('QL477_TELEMETRY_ALLOWLIST_OR_PROVENANCE_INVALID');
 const fieldDigest=digest({exportId:report.exportId,mainSha:expectedMainSha,
    install:i,first:f,recovery:r,firstFileSha256:report.firstFileSha256,
    recoveryFileSha256:report.recoveryFileSha256,telemetry:t});
 return {...held('QL477_LOCAL_EXPORT_NOT_INDEPENDENT_PHYSICAL_INSTALL_CERTIFICATION'),
   state:'FIELD_EXPORT_REVIEW_HELD',fieldDigest,sourceMainSha:expectedMainSha,
   sampleDigest:digest(t),sampleId:t.sampleId,runCount:2,telemetryRedacted:true,
   telemetry:t};
}
export function reviewQl477IndependentWitness({field,ownerPacket,witnessPacket,
   ownerPin,witnessPin,nowMs=Date.now()}={}){
 if(field?.state!=='FIELD_EXPORT_REVIEW_HELD'||typeof ownerPin!=='string'||
   typeof witnessPin!=='string'||ownerPin===witnessPin||
   !verifyQl468Packet(ownerPacket,ownerPin,ownerFields)||
   !verifyQl468Packet(witnessPacket,witnessPin,witnessFields))
   return held('QL477_DISTINCT_OWNER_AND_INDEPENDENT_WITNESS_SIGNATURES_REQUIRED');
 const o=ownerPacket.payload,w=witnessPacket.payload;
 if(o.schema!==QL477_OWNER||w.schema!==QL477_OBSERVER||o.host!==HOST||w.host!==HOST||
   o.mainSha!==field.sourceMainSha||w.mainSha!==field.sourceMainSha||
   !equal(o.fieldDigest,field.fieldDigest)||!equal(w.fieldDigest,field.fieldDigest)||
   !fresh(o.issuedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||
   !Number.isSafeInteger(o.expiresAtMs)||o.expiresAtMs<=nowMs||
   o.expiresAtMs-o.issuedAtMs>900000||
   o.scope!=='SUPERVISED_INSTALL_AND_LOCAL_RECOVERY_REVIEW_ONLY'||
   o.offlineBackupPersonallyVerified!==true||o.installPersonallyWitnessed!==true||
   o.recoveryPersonallyWitnessed!==true||o.automaticStart!==false||
   o.receiverEnable!==false||o.rebootAuthorization!==false||o.authorityTransfer!==false||
   w.independentObserver!==true||w.originalHostSeen!==true||
   w.taskActionVerified!==true||w.offlineRestoreSeen!==true||
   w.firstReceiptSeen!==true||w.recoveryReceiptSeen!==true||
   w.sourceIntact!==true||w.authorityTransfer!==false)
    return held('QL477_SIGNED_WITNESS_SCOPE_OR_FRESHNESS_INVALID');
 return {...held('QL477_VALID_SIGNATURES_ARE_CLAIMS_NOT_PHYSICAL_CERTIFICATION'),
  state:'SIGNED_ORIGINAL_HOST_CLAIMS_REVIEW_HELD',signaturesValid:true,
  fieldDigest:field.fieldDigest,sourceMainSha:field.sourceMainSha};
}
export function reviewQl477FirstTelemetry({field,envelope,ack,hostPin,receiverPin,
 priorMessageIds=[],nowMs=Date.now()}={}){
 if(field?.state!=='FIELD_EXPORT_REVIEW_HELD'||typeof hostPin!=='string'||
   typeof receiverPin!=='string'||hostPin===receiverPin||
   !Array.isArray(priorMessageIds)||priorMessageIds.length>10000||
   !priorMessageIds.every(x=>typeof x==='string'&&UUID.test(x))||
   !verifyQl468Packet(envelope,hostPin,outboundFields)||
   !verifyQl468Packet(ack,receiverPin,ackFields))
   return held('QL477_PINNED_HOST_AND_RECEIVER_SIGNED_PACKETS_REQUIRED');
 const e=envelope.payload,a=ack.payload;
 if(e.schema!==QL477_SIGNED_SAMPLE||a.schema!==QL477_SIGNED_ACK||
   e.issuer!==SRC||e.audience!=='rosevear-comms-hub'||
   a.issuer!=='rosevear-comms-hub'||a.audience!==SRC||
   !UUID.test(e.messageId??'')||priorMessageIds.includes(e.messageId)||
   a.messageId!==e.messageId||a.sourceApp!==SRC||
   !equal(e.sampleDigest,field.sampleDigest)||!equal(a.sampleDigest,field.sampleDigest)||
   e.dataClass!=='NON_SENSITIVE_AGGREGATE'||e.authorityTransfer!==false||
   a.authorityTransfer!==false||a.disposition!=='RECEIVED_READ_ONLY'||
   a.persistentReadBack!==true||
   !fresh(e.issuedAtMs,nowMs)||!Number.isSafeInteger(e.expiresAtMs)||
   e.expiresAtMs<=nowMs||e.expiresAtMs-e.issuedAtMs>300000||
   !fresh(a.receivedAtMs,nowMs)||a.receivedAtMs<e.issuedAtMs)
    return held('QL477_TELEMETRY_REPLAY_EXPIRY_OR_ACK_INTEGRITY_INVALID');
 return {...held('QL477_SIGNED_TELEMETRY_ACK_ONLY_TRANSPORT_NOT_INDEPENDENTLY_VERIFIED'),
   state:'SIGNED_FIRST_TELEMETRY_REVIEW_HELD',messageId:e.messageId,
   sampleId:field.sampleId,readOnlyAckClaimsVerified:true};
}
export const QL477_BOUNDARY=Object.freeze({actualOriginalHostInstall:'UNOBSERVED',
 localEvidenceExport:'OWNER_OPERATED',physicalRecovery:'HOLD',
 liveReceiver:'OFF',liveTransport:'HOLD',automaticTransmission:false,
 newTaskCreation:false,sourceDeletion:false,automaticReboot:false});
