/** QL-339B: private-server-only Ed25519 enrollment; never import into the browser. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';

export const ENROLLMENT_SCHEMA='rosevear.hub.relay.enrollment.v1';
const ID=/^[a-z0-9][a-z0-9._:-]{1,63}$/;
const SHA=/^[a-f0-9]{64}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const PAYLOAD_KEYS=['schema','issuer','audience','environment','deviceId','workloadId',
  'keyId','devicePublicKeyPem','deviceSpkiSha256','issuedAt','expiresAt',
  'windowsWitnessSha256','privateTlsWitnessSha256','tailnetAclWitnessSha256',
  'rollbackWitnessSha256'];
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&Object.keys(value).every(k=>keys.includes(k));
const hash=data=>createHash('sha256').update(data).digest('hex');
const denied=(state)=>({state,enrolled:false,connected:false,privateConnection:'DISCONNECTED / HOLD'});

/** The source and Comms owners must sign identical nonsecret enrollment details with
 * independent, pre-pinned authority keys. A client can never self-approve a device. */
export function verifyDeviceEnrollment(record,authorities={},now=Date.now()){
  if(!exact(record,['payload','approvals'])||!exact(record.payload,PAYLOAD_KEYS)||
    !exact(record.approvals,['source','master']))return denied('DENY_ENROLLMENT_SCHEMA');
  const p=record.payload;
  if(p.schema!==ENROLLMENT_SCHEMA||p.issuer!=='rosevear-ai-hub'||
    p.audience!=='rosevear-comms-hub:nonproduction'||p.environment!=='TEST'||
    !ID.test(p.deviceId??'')||!ID.test(p.workloadId??'')||!ID.test(p.keyId??'')||
    ![p.deviceSpkiSha256,p.windowsWitnessSha256,p.privateTlsWitnessSha256,
      p.tailnetAclWitnessSha256,p.rollbackWitnessSha256].every(v=>SHA.test(v??'')))
    return denied('DENY_DEVICE_OR_WITNESS_SCOPE');
  const issue=Date.parse(p.issuedAt),expiry=Date.parse(p.expiresAt);
  if(!Number.isFinite(issue)||!Number.isFinite(expiry)||issue>now+30_000||
    expiry<=now||expiry-issue>1_800_000||!/^\d{4}-\d\d-\d\dT.*\.\d{3}Z$/.test(p.issuedAt)||
    !/^\d{4}-\d\d-\d\dT.*\.\d{3}Z$/.test(p.expiresAt))
    return denied('HOLD_ENROLLMENT_EXPIRED_OR_UNBOUNDED');
  try{
    const deviceKey=createPublicKey(p.devicePublicKeyPem);
    if(deviceKey.asymmetricKeyType!=='ed25519'||
      hash(deviceKey.export({format:'der',type:'spki'}))!==p.deviceSpkiSha256)
      return denied('DENY_DEVICE_PIN');
    const trustedKeys=[];
    for(const role of ['source','master']){
      const signer=record.approvals[role],trusted=authorities[role];
      if(!exact(signer,['keyId','signature'])||!trusted||
        signer.keyId!==trusted.keyId||!SIG.test(signer.signature??''))
        return denied('HOLD_INDEPENDENT_OWNER_SIGNATURES');
      const publicKey=createPublicKey(trusted.publicKeyPem);
      if(publicKey.asymmetricKeyType!=='ed25519'||
        !verify(null,Buffer.from(`${role}:${canonicalize(p)}`),publicKey,
          Buffer.from(signer.signature,'base64url')))
        return denied('DENY_OWNER_SIGNATURE');
      trustedKeys.push(hash(publicKey.export({format:'der',type:'spki'})));
    }
    if(trustedKeys[0]===trustedKeys[1])return denied('DENY_NONINDEPENDENT_OWNER_KEYS');
    return {state:'SIGNED_TEST_ENROLLMENT_VERIFIED',enrolled:true,connected:false,
      privateConnection:'DISCONNECTED / HOLD',trust:{deviceId:p.deviceId,workloadId:p.workloadId,
        issuer:'rosevear-ai-hub',sourceOwnerTestApproval:true,masterOwnerTestApproval:true,
        originalDeviceWitness:true,independentSignerCustody:true,serverWorkloadVerified:true,
        privateTlsOriginPinned:true,tailnetAclDeniedUnapprovedDevices:true,
        rollbackWitnessVerified:true,killSwitchArmed:true,pinnedKeyId:p.keyId,
        pinnedPublicKeyPem:p.devicePublicKeyPem,pinnedSpkiSha256:p.deviceSpkiSha256}};
  }catch{return denied('DENY_INVALID_ENROLLMENT_KEYS');}
}

/** Concrete server-side lookup; records are never accepted from the HTTP request. */
export function postgresDeviceTrustResolver(query,authorities,now=()=>Date.now()){
  if(typeof query!=='function')throw new Error('PRIVATE_POSTGRES_QUERY_REQUIRED');
  return async (deviceId,workloadId,keyId)=>{
    if(!ID.test(deviceId??'')||!ID.test(workloadId??'')||!ID.test(keyId??''))return null;
    const result=await query(`SELECT e.enrollment_record,r.revoked_at
      FROM public.master_hub_device_enrollments_ql339b e
      LEFT JOIN public.master_hub_device_revocations_ql339b r
        USING (device_id,workload_id,key_id)
      WHERE e.device_id=$1 AND e.workload_id=$2 AND e.key_id=$3
        AND e.enrollment_state='REVIEWED_TEST' LIMIT 1`,
    [deviceId,workloadId,keyId]);
    const row=result.rows?.[0];
    if(!row||row.revoked_at!==null)return null;
    const verified=verifyDeviceEnrollment(row.enrollment_record,authorities,now());
    return verified.enrolled?verified.trust:null;
  };
}
