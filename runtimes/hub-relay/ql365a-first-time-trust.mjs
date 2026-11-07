/** QL-365A: explicitly new, offline dual-original-owner FIRST-TRUST proposal.
 * This is NOT QL-355 independent issuer/witness approval, database enrollment,
 * receiver activation, or permission to treat any of the six apps as connected.
 */
import {createHash,createPrivateKey,createPublicKey,randomBytes,sign,verify} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {inspectPublicAuthorityCandidate} from './owner-authority-custody.mjs';
import {hashWitnessFiles,verifiedCandidatePins} from './ql340b-enrollment.mjs';

export const QL365A_REQUEST_SCHEMA='rosevear.hub.ql365a.first-time-trust-request.v1';
export const QL365A_APPROVAL_SCHEMA='rosevear.hub.ql365a.first-time-owner-approval.v1';
export const QL365A_SIGNED_SCHEMA='rosevear.hub.ql365a.signed-first-time-trust-candidate.v1';
export const QL365A_PINS=Object.freeze({
  source:Object.freeze({role:'source',keyId:'source-owner-ql340a',
    spkiSha256:'e3be0648e3c9c7737c2857a8d36d31ea5c74a69211a55ac201347ce220d3158e',
    originalFileSha256:'e37042d382be26bedda70f72fa7934018bca0513fd1b106243618d450eaa2e43'}),
  master:Object.freeze({role:'master',keyId:'comms-master-jack-ql340a',
    spkiSha256:'3b086d0f89e51311b458eb94aa585f7b7a797a86c8061c8cd0b4b4d0b75585d5',
    originalFileSha256:'f5b0f8cb970ca6504be63f75898c21491a4f83feac8b7c5c5e408e4b729e0f8f'}),
});

const HASH=/^[0-9a-f]{64}$/;
const SHA256=value=>createHash('sha256').update(value).digest('hex');
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key));
const nowIso=value=>new Date(value).toISOString();
const expectedRole=(role,pins=QL365A_PINS)=>pins[role];
const domain=role=>`rosevear.hub.ql365a.first-time-trust.${role}:`;
const fail=reason=>{throw Error(reason);};

/** Checks the actual Ed25519 SPKI, not just a filename or user-reported SHA. */
export function inspectQl365aPinnedOwner(candidate,role,{originalBytes,pins=QL365A_PINS}={}){
  const pinned=expectedRole(role,pins);
  if(!pinned||!inspectPublicAuthorityCandidate(candidate,role).verified||
    candidate.keyId!==pinned.keyId||candidate.spkiSha256!==pinned.spkiSha256||
    candidate.enrollmentAuthorized!==false)
    return {verified:false,state:'DENY_QL365A_UNKNOWN_OR_CHANGED_ORIGINAL_OWNER'};
  if(originalBytes!==undefined&&SHA256(originalBytes)!==pinned.originalFileSha256)
    return {verified:false,state:'DENY_QL365A_ORIGINAL_PUBLIC_FILE_CHANGED'};
  return {verified:true,state:'PUBLIC_CANDIDATE_PIN_MATCHES_ORIGINAL_FIELD_READBACK',
    role,keyId:pinned.keyId,spkiSha256:pinned.spkiSha256,
    ownerIndependentlyAuthenticated:false,approvalSigned:false};
}

function inspectOffObservation(observation,witnessHashes,now){
  if(!observation||observation.schema!=='rosevear.hub.ql344.receiver-off-observation.v1'||
    observation.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
    observation.computer!=='DESKTOP-AE894KC'||
    String(observation.windowsUser).toLowerCase()!=='ree'||
    observation.receiverPort!==8788||observation.localListenerCount!==0||
    observation.tailscaleServeNoConfig!==true||observation.receiverOffObserved!==true||
    observation.originalReceiverStopped!==false||observation.receiverActivated!==false||
    observation.databaseEnrollmentCreated!==false||observation.connected!==false||
    [observation.originalIssuerEvidenceIndependentlyVerified,
      observation.independentOriginalOwnerApproval,observation.sourceSigned,
      observation.masterSigned,observation.requestMayBeSigned,
      observation.customerCommunications,observation.deviceActions]
      .some(x=>x!==false))
    fail('HOLD_QL365A_GENUINE_INITIAL_OFF_OBSERVATION_REQUIRED');
  const observed=Date.parse(observation.capturedAt);
  if(!Number.isFinite(observed)||now-observed< -5_000||now-observed>300_000)
    fail('HOLD_QL365A_FRESH_INITIAL_OFF_OBSERVATION_REQUIRED');
  if(!exact(observation.evidenceDigests,Object.keys(witnessHashes))||
    Object.entries(witnessHashes).some(([key,value])=>observation.evidenceDigests[key]!==value))
    fail('DENY_QL365A_OFF_OBSERVATION_WITNESS_DIGEST_DRIFT');
  return {kind:'INITIAL_RECEIVER_OFF_NOT_A_WITNESSED_ACTIVE_STOP',
    observedAt:observation.capturedAt,computer:observation.computer,
    receiverPort:8788,listenerCount:0,tailscaleServeNoConfig:true,
    originalReceiverStopped:false};
}

function validatePayload(payload,now,pins=QL365A_PINS){
  const fields=['schema','mode','audience','environment','originalHost','sourceWindowsUser',
    'masterHost','masterWindowsUser','device','ownerPins','witnessHashes',
    'baseline','receiverOffObservationSha256','legacyIssuerAuthenticated',
    'legacyWitnessAuthenticated','originalRollbackStopWitnessVerified',
    'databaseEnrollmentAuthorized','receiverActivated','sixAppGrantsAuthorized',
    'customerCommunications','deviceActions','issuedAt','expiresAt','nonce'];
  if(!exact(payload,fields)||payload.schema!=='rosevear.hub.ql365a.first-time-trust-payload.v1'||
    payload.mode!=='FIRST_TIME_DUAL_ORIGINAL_OWNER_TRUST_PROPOSAL_ONLY'||
    payload.audience!=='rosevear-comms-hub:offline-original-trust:TEST'||
    payload.environment!=='TEST'||payload.originalHost!=='DESKTOP-AE894KC'||
    payload.sourceWindowsUser!=='Ree'||payload.masterHost!=='TEMPLAR'||
    payload.masterWindowsUser!=='jfros'||
    !exact(payload.ownerPins,['source','master'])||
    !exact(payload.device,['deviceId','workloadId','keyId','deviceSpkiSha256'])||
    !HASH.test(payload.device.deviceSpkiSha256??'')||
    !exact(payload.witnessHashes,['windowsWitnessSha256','privateTlsWitnessSha256',
      'tailnetAclWitnessSha256','rollbackWitnessSha256'])||
    !Object.values(payload.witnessHashes).every(x=>HASH.test(x)&&x!=='0'.repeat(64))||
    new Set(Object.values(payload.witnessHashes)).size!==4||
    !HASH.test(payload.receiverOffObservationSha256??'')||
    !exact(payload.baseline,['kind','observedAt','computer','receiverPort','listenerCount',
      'tailscaleServeNoConfig','originalReceiverStopped'])||
    payload.baseline.kind!=='INITIAL_RECEIVER_OFF_NOT_A_WITNESSED_ACTIVE_STOP'||
    payload.baseline.computer!=='DESKTOP-AE894KC'||payload.baseline.receiverPort!==8788||
    payload.baseline.listenerCount!==0||payload.baseline.tailscaleServeNoConfig!==true||
    payload.baseline.originalReceiverStopped!==false||
    [payload.legacyIssuerAuthenticated,payload.legacyWitnessAuthenticated,
      payload.originalRollbackStopWitnessVerified,payload.databaseEnrollmentAuthorized,
      payload.receiverActivated,payload.sixAppGrantsAuthorized,
      payload.customerCommunications,payload.deviceActions].some(x=>x!==false)||
    !/^[0-9a-f]{32}$/.test(payload.nonce??''))
    return 'DENY_QL365A_FIRST_TIME_POLICY_SCHEMA';
  for(const role of ['source','master']){
    const pin=payload.ownerPins[role],expected=expectedRole(role,pins);
    if(!exact(pin,['keyId','spkiSha256','publicKeyPem'])||
      pin.keyId!==expected.keyId||pin.spkiSha256!==expected.spkiSha256)
      return 'DENY_QL365A_UNAPPROVED_ORIGINAL_OWNER_PIN';
    try{
      const key=createPublicKey(pin.publicKeyPem);
      if(key.asymmetricKeyType!=='ed25519'||
        SHA256(key.export({format:'der',type:'spki'}))!==expected.spkiSha256)
        return 'DENY_QL365A_PUBLIC_PIN_CRYPTOGRAPHY';
    }catch{return 'DENY_QL365A_PUBLIC_PIN_CRYPTOGRAPHY';}
  }
  if(payload.ownerPins.source.spkiSha256===payload.ownerPins.master.spkiSha256||
    [payload.ownerPins.source.spkiSha256,payload.ownerPins.master.spkiSha256]
      .includes(payload.device.deviceSpkiSha256))return 'DENY_QL365A_NONINDEPENDENT_KEYS';
  const issued=Date.parse(payload.issuedAt),expires=Date.parse(payload.expiresAt),
    baselineAt=Date.parse(payload.baseline.observedAt);
  if(!Number.isFinite(issued)||!Number.isFinite(expires)||!Number.isFinite(baselineAt)||
    expires-issued!==1_200_000||issued-baselineAt<0||issued-baselineAt>300_000||
    now<issued-5_000||now>=expires)return 'HOLD_QL365A_EXPIRED_OR_STALE_FIRST_TRUST';
  return null;
}

/** Produces only a time-limited PUBLIC proposal. The inert drill stays inert. */
export function createQl365aFirstTrustRequest({device,source,master,evidencePaths,
  offObservation,offObservationBytes,sourceOriginalBytes,now=Date.now(),
  nonce=randomBytes(16).toString('hex'),pins=QL365A_PINS}={}){
  if(!Buffer.isBuffer(sourceOriginalBytes)||!Buffer.isBuffer(offObservationBytes))
    fail('HOLD_QL365A_ORIGINAL_SOURCE_AND_OFF_OBSERVATION_BYTES_REQUIRED');
  const sourceCheck=inspectQl365aPinnedOwner(source,'source',{originalBytes:sourceOriginalBytes,pins});
  const masterCheck=inspectQl365aPinnedOwner(master,'master',{pins});
  if(!sourceCheck.verified||!masterCheck.verified)fail('HOLD_QL365A_PINNED_REE_AND_JACK_REQUIRED');
  verifiedCandidatePins({device,source,master});
  const witnessHashes=hashWitnessFiles(evidencePaths);
  const baseline=inspectOffObservation(offObservation,witnessHashes,now);
  const request={schema:QL365A_REQUEST_SCHEMA,payload:{
    schema:'rosevear.hub.ql365a.first-time-trust-payload.v1',
    mode:'FIRST_TIME_DUAL_ORIGINAL_OWNER_TRUST_PROPOSAL_ONLY',
    audience:'rosevear-comms-hub:offline-original-trust:TEST',environment:'TEST',
    originalHost:'DESKTOP-AE894KC',sourceWindowsUser:'Ree',
    masterHost:'TEMPLAR',masterWindowsUser:'jfros',
    device:{deviceId:device.deviceId,workloadId:device.workloadId,
      keyId:device.keyId,deviceSpkiSha256:device.deviceSpkiSha256},
    ownerPins:Object.fromEntries(['source','master'].map(role=>[role,{
      keyId:expectedRole(role,pins).keyId,spkiSha256:expectedRole(role,pins).spkiSha256,
      publicKeyPem:(role==='source'?source:master).publicKeyPem}])),
    witnessHashes,baseline,receiverOffObservationSha256:SHA256(offObservationBytes),
    legacyIssuerAuthenticated:false,legacyWitnessAuthenticated:false,
    originalRollbackStopWitnessVerified:false,databaseEnrollmentAuthorized:false,
    receiverActivated:false,sixAppGrantsAuthorized:false,customerCommunications:false,
    deviceActions:false,issuedAt:nowIso(now),expiresAt:nowIso(now+1_200_000),nonce},
    approvalState:'UNSIGNED_PUBLIC_FIRST_TIME_TRUST_PROPOSAL_ONLY',
    databaseEnrollmentCreated:false,receiverActivated:false};
  const inspected=inspectQl365aFirstTrustRequest(request,now,pins);
  if(!inspected.valid)fail(inspected.state);
  return request;
}

/** Pin overrides are for offline synthetic unit tests; production CLI never accepts them. */
export function inspectQl365aFirstTrustRequest(request,now=Date.now(),pins=QL365A_PINS){
  if(!exact(request,['schema','payload','approvalState','databaseEnrollmentCreated',
    'receiverActivated'])||request.schema!==QL365A_REQUEST_SCHEMA||
    request.approvalState!=='UNSIGNED_PUBLIC_FIRST_TIME_TRUST_PROPOSAL_ONLY'||
    request.databaseEnrollmentCreated!==false||request.receiverActivated!==false)
    return {valid:false,state:'DENY_QL365A_UNSIGNED_PROPOSAL_SCHEMA'};
  const problem=validatePayload(request.payload,now,pins);
  if(problem)return {valid:false,state:problem};
  return {valid:true,state:'PUBLIC_FIRST_TIME_TRUST_PROPOSAL_REQUIRES_SEPARATE_OWNER_DECISIONS',
    payloadSha256:SHA256(canonicalize(request.payload)),
    sourceKeyId:pins.source.keyId,masterKeyId:pins.master.keyId,
    sourceSpkiSha256:pins.source.spkiSha256,
    masterSpkiSha256:pins.master.spkiSha256,
    expiresAt:request.payload.expiresAt,initialReceiverOffOnly:true,
    legacyIndependentIssuerWitnessSatisfied:false,requestMayActivateReceiver:false,
    connected:false};
}

export function signQl365aFirstTrustRequest({request,role,localCandidate,
  originalPublicBytes,encryptedPrivateKeyPem,passphrase,now=Date.now(),pins=QL365A_PINS}={}){
  const inspected=inspectQl365aFirstTrustRequest(request,now,pins);
  if(!inspected.valid)fail(inspected.state);
  if(!Buffer.isBuffer(originalPublicBytes))fail('HOLD_QL365A_ORIGINAL_PUBLIC_BYTES_REQUIRED');
  const checked=inspectQl365aPinnedOwner(localCandidate,role,{originalBytes:originalPublicBytes,pins});
  if(!checked.verified||localCandidate.publicKeyPem!==request.payload.ownerPins[role]?.publicKeyPem)
    fail('DENY_QL365A_SIGNER_NOT_ORIGINAL_LOCAL_OWNER');
  if(typeof passphrase!=='string'||passphrase.length<16)fail('DENY_QL365A_PASSPHRASE');
  let privateKey;
  try{privateKey=createPrivateKey({key:encryptedPrivateKeyPem,format:'pem',passphrase});}
  catch{fail('DENY_QL365A_PRIVATE_KEY_DECRYPTION');}
  if(privateKey.asymmetricKeyType!=='ed25519'||
    SHA256(createPublicKey(privateKey).export({format:'der',type:'spki'}))!==checked.spkiSha256)
    fail('DENY_QL365A_PRIVATE_KEY_DOES_NOT_MATCH_PIN');
  return {schema:QL365A_APPROVAL_SCHEMA,role,keyId:checked.keyId,
    payloadSha256:inspected.payloadSha256,
    signature:sign(null,Buffer.from(domain(role)+canonicalize(request.payload)),
      privateKey).toString('base64url')};
}

export function verifyQl365aSignedFirstTrust({request,sourceApproval,masterApproval,
  now=Date.now(),pins=QL365A_PINS}={}){
  const inspected=inspectQl365aFirstTrustRequest(request,now,pins);
  if(!inspected.valid)return {valid:false,state:inspected.state};
  for(const [role,approval] of [['source',sourceApproval],['master',masterApproval]]){
    if(!exact(approval,['schema','role','keyId','payloadSha256','signature'])||
      approval.schema!==QL365A_APPROVAL_SCHEMA||approval.role!==role||
      approval.keyId!==pins[role].keyId||
      approval.payloadSha256!==inspected.payloadSha256||
      typeof approval.signature!=='string'||!/^[0-9A-Za-z_-]{86}$/.test(approval.signature))
      return {valid:false,state:`DENY_QL365A_${role.toUpperCase()}_DECISION`};
    try{
      if(!verify(null,Buffer.from(domain(role)+canonicalize(request.payload)),
        createPublicKey(request.payload.ownerPins[role].publicKeyPem),
        Buffer.from(approval.signature,'base64url')))
        return {valid:false,state:`DENY_QL365A_${role.toUpperCase()}_SIGNATURE`};
    }catch{return {valid:false,state:`DENY_QL365A_${role.toUpperCase()}_SIGNATURE`};}
  }
  return {valid:true,state:'TWO_ORIGINAL_OWNER_SIGNATURES_VERIFIED_FIRST_TRUST_CANDIDATE_ONLY',
    payloadSha256:inspected.payloadSha256,expiresAt:inspected.expiresAt,
    originalReeSigned:true,independentJackMasterSigned:true,
    legacyIndependentIssuerWitnessSatisfied:false,originalReceiverStopped:false,
    firstTimePolicyReviewRequired:true,privateAdminReviewRequired:true,
    databaseEnrollmentAuthorized:false,receiverActivated:false,
    sixAppGrantsAuthorized:false,customerCommunications:false,deviceActions:false,
    connected:false,connectionState:'DISCONNECTED / HOLD'};
}

export function assembleQl365aFirstTrust({request,sourceApproval,masterApproval,
  now=Date.now(),pins=QL365A_PINS}={}){
  const result=verifyQl365aSignedFirstTrust({request,sourceApproval,masterApproval,now,pins});
  if(!result.valid)fail(result.state);
  return {schema:QL365A_SIGNED_SCHEMA,request,approvals:{source:sourceApproval,master:masterApproval},
    decision:'DUAL_OWNER_FIRST_TIME_BOOTSTRAP_CANDIDATE_EXTERNAL_AUTHORITY_NOT_ESTABLISHED',
    privateDatabaseEnrollmentCreated:false,privateReceiverStarted:false,
    sourceAppGrantsChanged:false};
}

export function inspectQl365aSignedCandidate(candidate,now=Date.now(),pins=QL365A_PINS){
  if(!exact(candidate,['schema','request','approvals','decision',
    'privateDatabaseEnrollmentCreated','privateReceiverStarted','sourceAppGrantsChanged'])||
    candidate.schema!==QL365A_SIGNED_SCHEMA||
    candidate.decision!==
      'DUAL_OWNER_FIRST_TIME_BOOTSTRAP_CANDIDATE_EXTERNAL_AUTHORITY_NOT_ESTABLISHED'||
    candidate.privateDatabaseEnrollmentCreated!==false||
    candidate.privateReceiverStarted!==false||candidate.sourceAppGrantsChanged!==false||
    !exact(candidate.approvals,['source','master']))
    return {valid:false,state:'DENY_QL365A_SIGNED_CANDIDATE_SCHEMA'};
  return verifyQl365aSignedFirstTrust({request:candidate.request,
    sourceApproval:candidate.approvals.source,masterApproval:candidate.approvals.master,now,pins});
}
