/** QL-338: private Node-only Windows Hub receipt verifier, not an HTTP endpoint. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';

export const HUB_RELAY_SCHEMA='rosevear.hub.relay.heartbeat.v1';
const FIELDS=['schemaVersion','issuer','audience','deviceId','workloadId','environment','sequence',
  'nonce','sessionId','issuedAt','expiresAt','capabilities','queueDepth','relayMode'];
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).length===keys.length&&Object.keys(o).every(k=>keys.includes(k));
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[a-z0-9][a-z0-9._:-]{1,63}$/;
const NONCE=/^[A-Za-z0-9_-]{22,64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const sha=s=>createHash('sha256').update(s).digest('hex');
const iso=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)&&
  Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const held=(state,more={})=>Object.freeze({state,privateConnection:'DISCONNECTED / HOLD',
  relayActivated:false,deviceActions:0,liveCommunications:0,...more});

/** Synthetic signatures prove code compatibility, not issuer custody or real owner grants. */
export function verifyHubHeartbeat(packet,trust={},now=Date.now()){
  if(!exact(packet,['envelope','signature','keyId'])||!exact(packet.envelope,FIELDS))
    return held('DENY_HEARTBEAT_SCHEMA');
  const e=packet.envelope;
  if(e.schemaVersion!==HUB_RELAY_SCHEMA||e.issuer!=='rosevear-ai-hub'||
    e.audience!=='rosevear-comms-hub:nonproduction'||
    !ID.test(e.deviceId??'')||!ID.test(e.workloadId??'')||e.environment!=='TEST'||
    !Number.isSafeInteger(e.sequence)||e.sequence<1||
    !NONCE.test(e.nonce??'')||!UUID.test(e.sessionId??'')||
    !Number.isInteger(e.queueDepth)||e.queueDepth<0||e.queueDepth>100||
    e.relayMode!=='OUTBOUND_ONLY'||JSON.stringify(e.capabilities)!=='["health.read","capabilities.read"]')
    return held('DENY_DEVICE_SCOPE_OR_CAPABILITY');
  if(!iso(e.issuedAt)||!iso(e.expiresAt)||!Number.isFinite(now)||
    Date.parse(e.issuedAt)>now+30_000||now>=Date.parse(e.expiresAt)||
    Date.parse(e.expiresAt)-Date.parse(e.issuedAt)>120_000)
    return held('HOLD_EXPIRED_OR_FUTURE_HEARTBEAT');
  if(trust.deviceId!==e.deviceId||trust.workloadId!==e.workloadId||
    trust.issuer!=='rosevear-ai-hub'||trust.sourceOwnerTestApproval!==true||
    trust.masterOwnerTestApproval!==true||trust.originalDeviceWitness!==true||
    trust.independentSignerCustody!==true||trust.serverWorkloadVerified!==true||
    trust.privateTlsOriginPinned!==true||trust.tailnetAclDeniedUnapprovedDevices!==true||
    trust.rollbackWitnessVerified!==true||trust.killSwitchArmed!==true||
    trust.peerRedirected===true||trust.keyRevoked===true||
    !SHA.test(trust.pinnedSpkiSha256??'')||
    !SIG.test(packet.signature??'')||packet.keyId!==trust.pinnedKeyId)
    return held('HOLD_UNVERIFIED_DEVICE_OR_OWNER_AUTHORITY');
  try{
    const key=createPublicKey(trust.pinnedPublicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      sha(key.export({format:'der',type:'spki'}))!==trust.pinnedSpkiSha256||
      !verify(null,Buffer.from(canonicalize(e)),key,Buffer.from(packet.signature,'base64url')))
      return held('DENY_INVALID_DEVICE_SIGNATURE');
  }catch{return held('DENY_INVALID_DEVICE_SIGNATURE');}
  return held('SIGNED_TEST_DEVICE_PROOF_VERIFIED_RECEIPT_PENDING',
    {heartbeatSha256:sha(canonicalize(e)),verifiedSignature:true,
      requiresIndependentOnHostReadback:true});
}

/** Transaction must atomically enforce unique (issuer, device, session, sequence) and nonce. */
export function privateHubHeartbeatLedger(transaction){
  if(typeof transaction!=='function')throw new Error('PRIVATE_ATOMIC_TRANSACTION_REQUIRED');
  return {async receive(packet,trust,now=Date.now()){
    const result=verifyHubHeartbeat(packet,trust,now);
    if(result.state!=='SIGNED_TEST_DEVICE_PROOF_VERIFIED_RECEIPT_PENDING')return result;
    const e=packet.envelope;
    return transaction(async tx=>{
      const insertion=await tx.query(`INSERT INTO public.master_hub_relay_receipts_ql338
        (device_id,workload_id,session_id,sequence_no,nonce,heartbeat_sha256,queue_depth)
        VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING receipt_id`,
        [e.deviceId,e.workloadId,e.sessionId,e.sequence,e.nonce,result.heartbeatSha256,e.queueDepth]);
      if(insertion.rows.length===0)return held('DUPLICATE_OR_REPLAY_NO_EFFECT');
      return held('SAVED_ONE_HELD_DEVICE_RECEIPT',{receiptRecorded:true});
    });
  }};
}
