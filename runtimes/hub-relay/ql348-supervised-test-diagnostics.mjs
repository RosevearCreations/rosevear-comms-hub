/** QL-348: private, supervised readback ONLY. No enrolled principal, receipt,
 * peer connection or original-owner signature may be created by this module. */
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {readPrivateSixPeerSnapshot} from './ql341-private-readback.mjs';
import {verifyOneHeldTestReceipt} from './ql342-owner-decision.mjs';
import {restrictDirectory} from './owner-authority-custody.mjs';

export const QL348_SCHEMA='rosevear.hub.ql348.supervised-single-test-diagnostics.v1';
const SHA=/^[a-f0-9]{64}$/;
const hash=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const held=(state,extra={})=>({schema:QL348_SCHEMA,state,
  supervisedTestExecuted:false,independentIssuerAuthorityVerified:false,
  ownerApprovalGranted:false,receiverActivated:false,databaseWrites:0,
  connectedCount:0,customerCommunications:false,deviceActions:false,...extra});

/** Validates only that a QL347 file is a scoped *held* handoff; its text cannot
 * serve as identity proof or authorize a DB role, start, or one-time send. */
export function inspectQl347Handoff(handoff){
  const receipt=handoff?.receipt;
  const valid=handoff?.schema==='rosevear.hub.ql347.custody-handoff.v1'&&
    handoff.state==='RECONCILED_OFFLINE_HANDOFF_INDEPENDENT_AUTHORITY_HOLD'&&
    handoff.issuerCustodyVerified===false&&handoff.ownerEnrollmentAuthorized===false&&
    handoff.receiverActivated===false&&handoff.databaseEnrollmentCreated===false&&
    handoff.connected===false&&handoff.networkRequests===0&&
    handoff.customerCommunications===false&&handoff.deviceActions===false&&
    receipt?.schema===handoff.schema&&SHA.test(handoff.receiptSha256??'')&&
    hash(receipt)===handoff.receiptSha256&&
    SHA.test(receipt.ql346EvidenceSha256??'')&&SHA.test(receipt.issuerEvidenceSha256??'')&&
    ['HOLD','PENDING_INDEPENDENT_VERIFICATION'].includes(receipt.issuerCustodyDecision)&&
    Array.isArray(receipt.ownerDecisionDigests)&&receipt.ownerDecisionDigests.length===2&&
    receipt.ownerDecisionDigests.every((d,i)=>d?.role===['source','master'][i]&&
      SHA.test(d.digest??'')&&d.decision==='REVIEW_ACKNOWLEDGED_NO_ENROLLMENT');
  return held(valid?'SCOPED_QL347_HANDOFF_REQUIRES_INDEPENDENT_FIELD_AUTHORITY':
    'HOLD_INVALID_OR_REJECTED_QL347_HANDOFF',{handoffFormatValid:Boolean(valid)});
}

/** Existing private PostgreSQL role is queried read-only. An authentic single
 * receipt is independently checked against the original signer and DB records.
 * Even a successful Hub receipt does NOT connect the six source applications. */
export async function inspectSingleTestAndSixPeers(query,{handoff,packet,pins,ownerReview,
  now=Date.now()}={}){
  if(typeof query!=='function')return held('HOLD_PRIVATE_DATABASE_QUERY_REQUIRED');
  const gate=inspectQl347Handoff(handoff);
  if(!gate.handoffFormatValid)return gate;
  const snapshot=await readPrivateSixPeerSnapshot(query,{pins,packet,now});
  const diagnostics=snapshot.peers.map(peer=>({peerId:peer.peerId,
    repository:peer.repository,kind:peer.kind,state:'DISCONNECTED / HOLD',
    reason:'SOURCE_SIDE_SIGNED_TEST_HANDSHAKE_NOT_AUTHORIZED',
    sourceTestAuthorized:false,customerDataAllowed:false}));
  const one=packet&&pins&&ownerReview?
    await verifyOneHeldTestReceipt(query,pins,packet,ownerReview,now):
    {state:'HOLD_OWNER_REVIEW_AND_ONE_ORIGINAL_SIGNED_PACKET_REQUIRED',verified:false};
  return held(one.verified?'ONE_ORIGINAL_TEST_RECEIPT_VERIFIED_SIX_PEERS_STILL_HOLD':
    'HOLD_ONE_INDEPENDENTLY_VERIFIED_TEST_RECEIPT_REQUIRED',{
    inspectedAt:new Date(now).toISOString(),
    privateDatabaseRoleVerified:true,peerCount:6,diagnostics,
    observedHeldReceiptCount:snapshot.heldDeviceReceiptCount,
    singleTestReceiptVerified:one.verified===true,
    singleTestReceiptState:one.state,
    evidenceSource:'PRIVATE_POSTGRES_READ_ONLY_NOT_BROWSER_OR_OPERATOR_ASSERTION',
    nextAction:one.verified?
      'Obtain separate per-shell signed source handshakes; six peers remain HOLD':
      'Original issuer, two owners and independent field operator must complete a separate supervised single TEST ceremony'});
}

const readJson=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
export async function ql348Cli(args=process.argv.slice(2),env=process.env){
  if(args.length===1&&args[0]==='--help')return held('SUPERVISED_READ_ONLY_GUIDE',{
    commands:['--preflight QL347_HANDOFF.json',
      '--readback QL347_HANDOFF.json ORIGINAL_SIGNED_PACKET.json QL342_OWNER_REVIEW.json'],
    noSigning:true,noEnrollment:true,noReceiverStart:true,noPeerAuthorization:true});
  if(args.length===2&&args[0]==='--preflight')return inspectQl347Handoff(readJson(args[1]));
  if(args.length!==4||args[0]!=='--readback')
    throw Error('DENY_UNSUPERVISED_QL348_ACTION');
  if(process.platform!=='win32'||!env.LOCALAPPDATA||!env.DATABASE_URL||
    String(env.COMPUTERNAME??'').toUpperCase()!=='DESKTOP-AE894KC')
    throw Error('HOLD_ORIGINAL_WINDOWS_HOST_AND_PRIVATE_DATABASE_CREDENTIAL_REQUIRED');
  const base=join(env.LOCALAPPDATA,'RosevearAIHub','CommsRelay');
  const pinsFile=join(base,'Enrollment','ql340b-private-owner-public-pins.json');
  if(!existsSync(pinsFile))throw Error('HOLD_ORIGINAL_OWNER_PUBLIC_PINS_REQUIRED');
  const handoff=readJson(args[1]);
  if(!inspectQl347Handoff(handoff).handoffFormatValid)
    throw Error('HOLD_QL347_ORIGINAL_OWNER_HANDOFF_NOT_VALID');
  const {Pool}=await import('pg');
  const pool=new Pool({connectionString:env.DATABASE_URL,
    ssl:{rejectUnauthorized:true},max:1,connectionTimeoutMillis:5000});
  let result;
  try{result=await inspectSingleTestAndSixPeers(pool.query.bind(pool),{
    handoff,packet:readJson(args[2]),ownerReview:readJson(args[3]),pins:readJson(pinsFile)});}
  finally{await pool.end();}
  const directory=join(base,'Evidence');
  if(!existsSync(directory))throw Error('HOLD_PRIVATE_EVIDENCE_DIRECTORY_REQUIRED');
  restrictDirectory(directory);
  const path=join(directory,'ql348-supervised-readback-'+new Date().toISOString()
    .replace(/[:.]/g,'-')+'.json');
  writeFileSync(path,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  return {schema:QL348_SCHEMA,state:result.state,readbackFile:path,
    singleTestReceiptVerified:result.singleTestReceiptVerified,
    connectedCount:0,databaseWrites:0,customerCommunications:false,deviceActions:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql348Cli())+'\n');}
  catch{process.stderr.write('HOLD_QL348_SUPERVISED_READBACK_NOT_AUTHORIZED\n');process.exitCode=1;}
}
