/**
 * QL-479 | Opt-in remote SysOp pilot, not an unattended service.
 * Two owner-enrolled independent signers; TLS1.3 client cert; pinned server cert;
 * one immutable message; durable signed ACK; separately signed observer review.
 * No listener or transmission starts by importing this module.
 */
import {createHash,createPrivateKey,createPublicKey,sign,X509Certificate,timingSafeEqual} from 'node:crypto';
import {request as httpsRequest} from 'node:https';
import {checkServerIdentity} from 'node:tls';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';
import {QL478_ROUTE,QL478_SAMPLE,createQl478PrivateSink,
 createQl478UnboundHttpsServer,verifyQl478SignedAck} from './ql478-private-pilot.mjs';

export const QL479_ENROLL='rosevear.comms.ql479.remote-peer-enrollment.v1';
export const QL479_AUDIT='rosevear.comms.ql479.independent-remote-ack-audit.v1';
const HEX=/^[a-f0-9]{64}$/, SHA=/^[a-f0-9]{40}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const enrollmentFields=['schema','enrollmentId','pilotMessageId','sourceHost','sourceApp',
 'sourceMainSha','fieldDigest','sampleDigest','sourceSignerPin','receiverSignerPin',
 'tlsClientLeafSha256','tlsServerLeafSha256','remoteHost','remotePort','route',
 'environment','dataClass','issuedAtMs','expiresAtMs','messageLimit',
 'autostart','customerDataIncluded','authorityTransfer'];
const sampleFields=['schema','messageId','host','sourceApp','sourceMainSha',
 'workerScriptSha256','fieldDigest','sampleDigest','sampleId','osBootId',
 'observedAtMs','uptimeSeconds','processCount','dataClass','issuedAtMs',
 'expiresAtMs','authorityTransfer','receiverEnableAuthorized'];
const auditFields=['schema','enrollmentId','sourceMainSha','fieldDigest',
 'messageId','ackDigest','tlsClientLeafSha256','tlsServerLeafSha256',
 'remoteHost','remotePort','originalHostSeen','receiverLedgerSeen',
 'sourceClonesPreserved','observerIndependent','observedAtMs',
 'rebootPerformed','authorityTransfer'];
const hash=x=>createHash('sha256').update(Buffer.isBuffer(x)||typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const reject=reason=>Object.freeze({state:'HOLD',reason,
  originalHostCertified:false,independentFirstAckCertified:false,
  productionPeerEnrolled:false,receiverAutostart:false,sourceDeletions:0});
const isRealHost=n=>typeof n==='string'&&n.length<=240&&
 /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$/.test(n)&&
 !/^\d+(?:\.\d+){3}$/.test(n)&&
 !/\.(?:localhost|local|internal|test|example|invalid)$/.test(n);
const simHost=n=>n==='127.0.0.1';
const keypin=k=>createPublicKey(k).export({format:'der',type:'spki'}).toString('base64');
const privateKey=k=>{let p;try{p=k?.type==='private'?k:createPrivateKey(k)}
 catch{throw Error('QL479_PRIVATE_ED25519_KEY_REQUIRED')}
 if(p.asymmetricKeyType!=='ed25519')throw Error('QL479_ED25519_REQUIRED');
 return p};
const leaf=cert=>hash(new X509Certificate(cert).raw);
function currentEnrollment(review,nowMs=Date.now()){
 const e=review?.enrollment;
 if(!e||!['SIMULATION_ENROLLED_HELD','REMOTE_ENROLLED_REVIEW_HELD'].includes(review.state)||
    !Number.isSafeInteger(nowMs)||nowMs<e.issuedAtMs||nowMs>=e.expiresAtMs)
    throw Error('QL479_FRESH_DISTINCT_PEER_ENROLLMENT_REQUIRED');
 return e;
}
export function reviewQl479PeerEnrollment({ownerPacket,receiverPacket,ownerPin,
 receiverCustodianPin,field,nowMs=Date.now()}={}){
 if(typeof ownerPin!=='string'||typeof receiverCustodianPin!=='string'||
    ownerPin===receiverCustodianPin||
    !verifyQl468Packet(ownerPacket,ownerPin,enrollmentFields)||
    !verifyQl468Packet(receiverPacket,receiverCustodianPin,enrollmentFields))
  return reject('QL479_DISTINCT_ENROLLMENT_SIGNATURES_REQUIRED');
 const e=ownerPacket.payload;
 if(JSON.stringify(e)!==JSON.stringify(receiverPacket.payload)||
    e.schema!==QL479_ENROLL||!UUID.test(e.enrollmentId??'')||
    !UUID.test(e.pilotMessageId??'')||e.sourceHost!=='DESKTOP-AE894KC'||
    e.sourceApp!=='rosevear-comms-hub'||!SHA.test(e.sourceMainSha??'')||
    !HEX.test(e.fieldDigest??'')||!HEX.test(e.sampleDigest??'')||
    e.sourceSignerPin===e.receiverSignerPin||
    !HEX.test(e.tlsClientLeafSha256??'')||!HEX.test(e.tlsServerLeafSha256??'')||
    e.route!==QL478_ROUTE||e.dataClass!=='NON_SENSITIVE_AGGREGATE'||
    e.messageLimit!==1||e.autostart!==false||e.customerDataIncluded!==false||
    e.authorityTransfer!==false||!Number.isInteger(e.remotePort)||
    e.remotePort<1024||e.remotePort>65535||e.remotePort===8788||
    !Number.isSafeInteger(nowMs)||!Number.isSafeInteger(e.issuedAtMs)||
    !Number.isSafeInteger(e.expiresAtMs)||e.issuedAtMs>nowMs||
    nowMs-e.issuedAtMs>300000||e.expiresAtMs<=nowMs||
    e.expiresAtMs-e.issuedAtMs>900000||
    !(e.environment==='ISOLATED_SIMULATION'?simHost(e.remoteHost):
      e.environment==='SUPERVISED_REMOTE'&&isRealHost(e.remoteHost)))
  return reject('QL479_PEER_IDENTITY_TIME_SCOPE_OR_PORT_INVALID');
 // Confirm both signer pins are syntactically valid Ed25519 SPKI.
 try{
  for(const pin of [e.sourceSignerPin,e.receiverSignerPin]){
   const b=Buffer.from(pin,'base64');
   if(b.toString('base64')!==pin||
     createPublicKey({key:b,format:'der',type:'spki'}).asymmetricKeyType!=='ed25519')
     throw Error('bad public pin');
  }
 }catch{return reject('QL479_PEER_PUBLIC_KEYS_INVALID')}
 if(field?.state!=='FIELD_EXPORT_REVIEW_HELD'||field.sourceMainSha!==e.sourceMainSha||
    !same(field.fieldDigest,e.fieldDigest)||!same(field.sampleDigest,e.sampleDigest))
   return reject('QL479_VERIFIED_SOURCE_FIELD_AND_REVISION_REQUIRED');
 return {...reject('QL479_SIGNED_ENROLLMENT_IS_NOT_PHYSICAL_HOST_ACCEPTANCE'),
  state:e.environment==='ISOLATED_SIMULATION'?'SIMULATION_ENROLLED_HELD':'REMOTE_ENROLLED_REVIEW_HELD',
  enrollment:e,enrollmentDigest:hash(e),simulated:e.environment==='ISOLATED_SIMULATION'};
}
export function buildQl479SignedSample({enrollmentReview,field,hostPrivateKey,
 nowMs=Date.now()}={}){
 const e=currentEnrollment(enrollmentReview,nowMs);
 if(field?.state!=='FIELD_EXPORT_REVIEW_HELD'||field.sourceMainSha!==e.sourceMainSha||
  !same(field.fieldDigest,e.fieldDigest)||!same(field.sampleDigest,e.sampleDigest))
    throw Error('QL479_SOURCE_EVIDENCE_CHANGED');
 const signer=privateKey(hostPrivateKey);
 if(keypin(signer)!==e.sourceSignerPin)throw Error('QL479_SOURCE_SIGNER_PIN_CHANGED');
 const s=field.telemetry;
 const payload={schema:QL478_SAMPLE,messageId:e.pilotMessageId,host:e.sourceHost,
  sourceApp:e.sourceApp,sourceMainSha:e.sourceMainSha,
  workerScriptSha256:s.workerScriptSha256,fieldDigest:e.fieldDigest,
  sampleDigest:e.sampleDigest,sampleId:s.sampleId,osBootId:s.osBootId,
  observedAtMs:s.observedAtMs,uptimeSeconds:s.uptimeSeconds,
  processCount:s.processCount,dataClass:e.dataClass,issuedAtMs:nowMs,
  expiresAtMs:Math.min(nowMs+60000,e.expiresAtMs),
  authorityTransfer:false,receiverEnableAuthorized:false};
 return {payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),signer).toString('base64')};
}
/** Receiver-side: require same owner-enrolled evidence; caller chooses manual listen. */
export function createQl479UnboundRemoteReceiver({enrollmentReview,field,directory,
 receiverPrivateKey,tlsOptions,now=()=>Date.now()}={}){
 const e=currentEnrollment(enrollmentReview,now());
 const signer=privateKey(receiverPrivateKey);
 if(keypin(signer)!==e.receiverSignerPin)throw Error('QL479_RECEIVER_SIGNER_MISMATCH');
 if(field?.state!=='FIELD_EXPORT_REVIEW_HELD'||field.sourceMainSha!==e.sourceMainSha||
    !same(field.fieldDigest,e.fieldDigest)||
    tlsOptions?.pinnedHostIssuerPin!==e.sourceSignerPin||!tlsOptions?.cert||
    leaf(tlsOptions.cert)!==e.tlsServerLeafSha256)
   throw Error('QL479_RECEIVER_FIELD_OR_TLS_CERT_MISMATCH');
 const sink=createQl478PrivateSink({directory,hostIssuerPin:e.sourceSignerPin,
   receiverPrivateKey:signer,expectedField:field,
   clientLeafSha256:e.tlsClientLeafSha256,now});
 const limitedSink={receive:args=>args?.packet?.payload?.messageId===e.pilotMessageId?
    sink.receive(args):{httpStatus:403,
     body:{state:'HOLD',reason:'QL479_SINGLE_PILOT_MESSAGE_ONLY'},noDispatch:true}};
 const server=createQl478UnboundHttpsServer({sink:limitedSink,tlsOptions});
 return Object.freeze({server,state:'UNBOUND_SUPERVISED_REMOTE_PILOT',
  autoListen:false,oneMessageOnly:true,pilotMessageId:e.pilotMessageId});
}
/**
 * ONE remote HTTPS request, TLS1.3 client auth, normal CA+hostname validation
 * AND exact server leaf pin. No redirects, unsafe retry or automatic startup.
 * Simulation can override ephemeral port ONLY for 127.0.0.1.
 */
export async function sendQl479Once({enrollmentReview,field,packet,tlsOptions,
 simulationPort,nowMs=Date.now()}={}){
 const e=currentEnrollment(enrollmentReview,nowMs);
 if(field?.state!=='FIELD_EXPORT_REVIEW_HELD'||field.sourceMainSha!==e.sourceMainSha||
   !same(field.fieldDigest,e.fieldDigest)||!same(field.sampleDigest,e.sampleDigest)||
   !verifyQl468Packet(packet,e.sourceSignerPin,sampleFields)||
   packet.payload.messageId!==e.pilotMessageId||
   packet.payload.fieldDigest!==e.fieldDigest||
   packet.payload.sampleDigest!==e.sampleDigest||
   packet.payload.sourceMainSha!==e.sourceMainSha||
   packet.payload.dataClass!=='NON_SENSITIVE_AGGREGATE'||
   packet.payload.authorityTransfer!==false||
   packet.payload.receiverEnableAuthorized!==false||
   packet.payload.expiresAtMs<=nowMs||packet.payload.issuedAtMs>nowMs)
  return reject('QL479_ORIGINAL_SIGNED_FIELD_MESSAGE_OR_TTL_INVALID');
 if(!tlsOptions?.ca||!tlsOptions?.cert||!tlsOptions?.key||
    leaf(tlsOptions.cert)!==e.tlsClientLeafSha256)
   return reject('QL479_ENROLLED_MTLS_CLIENT_CERT_REQUIRED');
 const port=(e.environment==='ISOLATED_SIMULATION'&&
   Number.isInteger(simulationPort)&&simulationPort>1023&&simulationPort<=65535)
   ?simulationPort:e.remotePort;
 if(e.environment!=='ISOLATED_SIMULATION'&&simulationPort!==undefined)
   return reject('QL479_REMOTE_PORT_OVERRIDE_FORBIDDEN');
 try{
  const response=await new Promise((resolve,fail)=>{
   let tlsPeerVerified=false;
   const req=httpsRequest({hostname:e.remoteHost,port,method:'POST',
     path:QL478_ROUTE,ca:tlsOptions.ca,cert:tlsOptions.cert,key:tlsOptions.key,
     rejectUnauthorized:true,minVersion:'TLSv1.3',agent:false,timeout:10000,
     checkServerIdentity:(host,certificate)=>{
       const error=checkServerIdentity(host,certificate);
       if(error)return error;
       if(!same(hash(certificate.raw),e.tlsServerLeafSha256))
         return Error('QL479_SERVER_CERT_PIN_MISMATCH');
       tlsPeerVerified=true;return undefined;
     }},res=>{
       if(!tlsPeerVerified||!res.socket?.authorized){
         res.resume();fail(Error('QL479_TLS_SERVER_NOT_AUTHENTICATED'));return
       }
       let bytes=0,parts=[];
       res.on('data',chunk=>{
         bytes+=chunk.length;
         if(bytes>8192){res.destroy(Error('QL479_ACK_TOO_LARGE'));return}
         parts.push(chunk);
       });
       res.on('error',fail);
       res.on('end',()=>{
        try{resolve({status:res.statusCode,ack:JSON.parse(Buffer.concat(parts).toString('utf8'))})}
        catch{fail(Error('QL479_INVALID_RECEIVER_ACK'))}
       });
     });
   req.on('timeout',()=>req.destroy(Error('QL479_REMOTE_TLS_TIMEOUT')));
   req.on('error',fail);
   req.end(JSON.stringify(packet));
  });
  if(![200,202].includes(response.status))
    return reject('QL479_REMOTE_RECEIVER_REJECTED_'+response.status);
  const review=verifyQl478SignedAck({packet,ack:response.ack,
    hostPin:e.sourceSignerPin,receiverPin:e.receiverSignerPin,
    expectedLeafSha256:e.tlsClientLeafSha256,nowMs:Date.now()});
  if(review.state!=='SIGNED_DURABLE_ACK_REVIEW_HELD')
    return reject('QL479_REMOTE_SIGNED_ACK_INTEGRITY_FAILED');
  return {...reject('QL479_REMOTE_TRANSPORT_OBSERVED_NOT_INDEPENDENTLY_FIELD_CERTIFIED'),
   state:e.environment==='ISOLATED_SIMULATION'?'SIMULATED_REMOTE_MTLS_ACK_HELD':'REMOTE_MTLS_ACK_OBSERVED_REVIEW_HELD',
   enrollmentId:e.enrollmentId,messageId:e.pilotMessageId,
   fieldDigest:e.fieldDigest,ackDigest:review.ackDigest,ack:response.ack,
   packet,serverCertPinned:true,tls1_3Required:true,durableAckSigned:true,
   simulated:e.environment==='ISOLATED_SIMULATION'};
 }catch(error){
  return reject(error?.message?.startsWith('QL479_')?error.message:'QL479_REMOTE_TLS_OR_TRANSPORT_FAILED');
 }
}
export function reviewQl479IndependentFirstAck({enrollmentReview,field,transport,
 auditorPacket,auditorPin,ownerPin,receiverCustodianPin,nowMs=Date.now()}={}){
 const e=enrollmentReview?.enrollment;
 if(!e||!['SIMULATED_REMOTE_MTLS_ACK_HELD','REMOTE_MTLS_ACK_OBSERVED_REVIEW_HELD'].includes(transport?.state)||
    !enrollmentReview.enrollmentDigest||field?.state!=='FIELD_EXPORT_REVIEW_HELD'||
    transport.messageId!==e.pilotMessageId||transport.enrollmentId!==e.enrollmentId||
    !same(transport.fieldDigest,e.fieldDigest)||
    typeof auditorPin!=='string'||auditorPin===ownerPin||
    auditorPin===receiverCustodianPin||auditorPin===e.sourceSignerPin||
    auditorPin===e.receiverSignerPin||
    !verifyQl468Packet(auditorPacket,auditorPin,auditFields))
   return reject('QL479_INDEPENDENT_FIELD_FIRST_ACK_AUDITOR_REQUIRED');
 const signedAck=verifyQl478SignedAck({packet:transport.packet,ack:transport.ack,
   hostPin:e.sourceSignerPin,receiverPin:e.receiverSignerPin,
   expectedLeafSha256:e.tlsClientLeafSha256,nowMs});
 if(signedAck.state!=='SIGNED_DURABLE_ACK_REVIEW_HELD'||
    !same(signedAck.ackDigest,transport.ackDigest))
    return reject('QL479_RECEIVER_ACK_REVALIDATION_REQUIRED');
 const a=auditorPacket.payload;
 if(a.schema!==QL479_AUDIT||a.enrollmentId!==e.enrollmentId||
    a.sourceMainSha!==e.sourceMainSha||!same(a.fieldDigest,e.fieldDigest)||
    a.messageId!==e.pilotMessageId||!same(a.ackDigest,transport.ackDigest)||
    !same(a.tlsClientLeafSha256,e.tlsClientLeafSha256)||
    !same(a.tlsServerLeafSha256,e.tlsServerLeafSha256)||
    a.remoteHost!==e.remoteHost||a.remotePort!==e.remotePort||
    a.originalHostSeen!==true||a.receiverLedgerSeen!==true||
    a.sourceClonesPreserved!==true||a.observerIndependent!==true||
    a.rebootPerformed!==false||a.authorityTransfer!==false||
    !Number.isSafeInteger(a.observedAtMs)||a.observedAtMs>nowMs||
    nowMs-a.observedAtMs>300000||
    a.observedAtMs<transport.ack?.payload?.receivedAtMs)
    return reject('QL479_AUDITOR_SCOPE_EVIDENCE_OR_TIMING_INVALID');
 return {...reject('QL479_SIGNED_AUDITOR_CLAIMS_REQUIRE_INDEPENDENT_PHYSICAL_CHECK'),
    state:'INDEPENDENTLY_SIGNED_REMOTE_ACK_REVIEW_HELD',
    enrollmentId:e.enrollmentId,ackDigest:transport.ackDigest,
    signedClaimsCorrelated:true,fieldEvidenceRequired:true};
}
export const QL479_BOUNDARY=Object.freeze({autoListen:false,autoStart:false,
 publicCloudflareEndpoint:false,originalHostInstall:'UNOBSERVED',
 remoteReceiverAuthority:'OWNER_MANUAL_ONLY',firstProductionAck:'HOLD',
 customerRecords:false,financialWrites:false,sourceDeletions:0});
