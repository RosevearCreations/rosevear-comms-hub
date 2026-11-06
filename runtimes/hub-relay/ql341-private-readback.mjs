/** QL-341: private Windows/Node ONLY. Never imported into the public Worker. */
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {postgresDeviceTrustResolver} from './enrollment.mjs';
import {verifyHubHeartbeat} from './heartbeat.mjs';
import {restrictDirectory} from './owner-authority-custody.mjs';

const REPOS=Object.freeze({rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']});
const ID=Object.keys(REPOS);
const SHA=/^[a-f0-9]{64}$/;
const hold=state=>({state,verified:false,connected:false});
const sha=s=>createHash('sha256').update(s).digest('hex');

export function validateSixHeldPeers(rows){
  if(!Array.isArray(rows)||rows.length!==6)throw Error('HOLD_SIX_PEER_REGISTRY_INCOMPLETE');
  const seen=new Set();
  const peers=[];
  for(const row of rows){
    const expected=REPOS[row?.peer_id];
    if(!expected||seen.has(row.peer_id)||row.peer_kind!==expected[0]||
      row.source_repo!==expected[1]||row.connection_state!=='HOLD'||
      row.source_test_authorized!==false||row.customer_data_allowed!==false)
      throw Error('DENY_UNREVIEWED_OR_ELEVATED_PEER_REGISTRY');
    seen.add(row.peer_id);
    peers.push({peerId:row.peer_id,kind:row.peer_kind,repository:row.source_repo,
      connection:'DISCONNECTED / HOLD',sourceTestAuthorized:false,customerDataAllowed:false});
  }
  return peers.sort((a,b)=>ID.indexOf(a.peerId)-ID.indexOf(b.peerId));
}

/** One REAL original-device signature must match one independently queried
 * append-only PostgreSQL receipt and both database-enrolled owner signers. */
export async function verifySignedTestReceipt(query,pins,packet,now=Date.now()){
  const envelope=packet?.envelope;
  if(!envelope||envelope.deviceId!=='rosevear-windows-hub'||
    envelope.workloadId!=='hub-probe'||packet.keyId!=='hub-ql339b')
    return hold('HOLD_UNEXPECTED_OR_MISSING_ORIGINAL_DEVICE_PACKET');
  const digest=sha(canonicalize(envelope));
  const result=await query(`SELECT device_id,workload_id,session_id,sequence_no,
    nonce,heartbeat_sha256,queue_depth,source_app_id,connection_state,received_at
    FROM public.master_hub_relay_receipts_ql338
    WHERE device_id=$1 AND workload_id=$2 AND session_id=$3
      AND sequence_no=$4 AND nonce=$5 LIMIT 2`,
    [envelope.deviceId,envelope.workloadId,envelope.sessionId,envelope.sequence,envelope.nonce]);
  if(result.rows?.length!==1)return hold('HOLD_NO_UNIQUE_POSTGRES_RECEIPT');
  // pg parses timestamptz into a Date; accept its actual runtime return type.
  const row=result.rows[0],received=new Date(row.received_at).getTime();
  if(!Number.isFinite(received)||received>now+30_000||received<0||
    row.device_id!==envelope.deviceId||row.workload_id!==envelope.workloadId||
    row.session_id!==envelope.sessionId||Number(row.sequence_no)!==envelope.sequence||
    row.nonce!==envelope.nonce||row.heartbeat_sha256!==digest||
    Number(row.queue_depth)!==envelope.queueDepth||
    row.source_app_id!=='rosevear-ai-hub'||row.connection_state!=='HOLD')
    return hold('DENY_POSTGRES_RECEIPT_CONTENT_MISMATCH');
  const trust=await postgresDeviceTrustResolver(query,pins,()=>received)(
    envelope.deviceId,envelope.workloadId,packet.keyId);
  if(!trust)return hold('HOLD_ORIGINAL_OWNER_ENROLLMENT_MISSING_OR_REVOKED');
  const checked=verifyHubHeartbeat(packet,trust,received);
  if(checked.state!=='SIGNED_TEST_DEVICE_PROOF_VERIFIED_RECEIPT_PENDING'||
    checked.heartbeatSha256!==digest)
    return hold('DENY_ORIGINAL_DEVICE_SIGNATURE_OR_SCOPE');
  return {state:'ORIGINAL_SIGNED_TEST_HEARTBEAT_AND_DB_RECEIPT_VERIFIED',
    verified:true,connected:false,deviceId:envelope.deviceId,
    receivedAt:new Date(received).toISOString(),
    freshness:now-received<=900_000?'RECENT_TEST_ONLY':'HISTORICAL_TEST_ONLY',
    customerCommunications:false,deviceActions:false};
}

export async function readPrivateSixPeerSnapshot(query,{pins,packet,now=Date.now()}={}){
  if(typeof query!=='function')throw Error('HOLD_PRIVATE_POSTGRES_REQUIRED');
  const identity=await query('SELECT current_user AS receiver_role');
  if(identity.rows?.[0]?.receiver_role!=='ql340c_private_receiver')
    throw Error('DENY_UNVERIFIED_PRIVATE_DATABASE_ROLE');
  const peerRows=await query(`SELECT peer_id,peer_kind,source_repo,connection_state,
    source_test_authorized,customer_data_allowed
    FROM public.master_hub_private_peers_ql341 ORDER BY peer_id`);
  const peers=validateSixHeldPeers(peerRows.rows);
  const count=await query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
  const heldCount=Number(count.rows?.[0]?.count);
  if(!Number.isSafeInteger(heldCount)||heldCount<0)
    throw Error('HOLD_UNVERIFIED_PRIVATE_RECEIPT_COUNT');
  const witness=packet?await verifySignedTestReceipt(query,pins,packet,now):
    hold('NOT_OBSERVED_NO_ORIGINAL_SIGNED_TEST_PACKET');
  return {schema:'rosevear.hub.ql341.private-peer-readback.v1',
    exportedAt:new Date(now).toISOString(),source:'PRIVATE_POSTGRES_OWNER_READBACK',
    peerCount:6,connectedCount:0,customerCommunications:0,deviceActions:0,
    authorizedExternalGets:0,heldDeviceReceiptCount:heldCount,peers,witness};
}

export async function readbackCli(args=process.argv.slice(2),environment=process.env){
  if(args.length===1&&args[0]==='--help')return {schema:'rosevear.hub.ql341.readback-cli.v1',
    commands:['--readback [ORIGINAL_SIGNED_TEST_PACKET_JSON]'],
    databaseWrites:0,customerCommunications:false,deviceActions:false};
  if(args.length<1||args.length>2||args[0]!=='--readback')
    throw Error('DENY_UNKNOWN_PRIVATE_READBACK_ACTION');
  if(process.platform!=='win32'||!environment.LOCALAPPDATA||!environment.DATABASE_URL)
    throw Error('HOLD_OWNER_WINDOWS_AND_PRIVATE_CREDENTIAL_REQUIRED');
  const base=join(environment.LOCALAPPDATA,'RosevearAIHub','CommsRelay');
  const pinsPath=join(base,'Enrollment','ql340b-private-owner-public-pins.json');
  if(args.length===2&&!existsSync(pinsPath))
    throw Error('HOLD_ORIGINAL_OWNER_PUBLIC_PINS_REQUIRED');
  const pins=args.length===2?JSON.parse(readFileSync(pinsPath,'utf8')):undefined;
  const packet=args.length===2?JSON.parse(readFileSync(resolve(args[1]),'utf8')):undefined;
  const {Pool}=await import('pg');
  const pool=new Pool({connectionString:environment.DATABASE_URL,
    ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:5000});
  let snapshot;
  try{snapshot=await readPrivateSixPeerSnapshot(pool.query.bind(pool),{pins,packet});}
  finally{await pool.end();}
  const directory=join(base,'Evidence');
  if(!existsSync(directory))throw Error('HOLD_OWNER_PRIVATE_EVIDENCE_FOLDER_MISSING');
  restrictDirectory(directory);
  const path=join(directory,`ql341-private-readback-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
  writeFileSync(path,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx',mode:0o600});
  return {state:'PRIVATE_READ_ONLY_PEER_SNAPSHOT_CREATED_FOR_OWNER_REVIEW',
    path,peerCount:snapshot.peerCount,connectedCount:0,
    witnessState:snapshot.witness.state,receiverActivated:false};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await readbackCli())+'\n');}
  catch{process.stderr.write('HOLD_PRIVATE_QL341_READBACK_NOT_VERIFIED\n');process.exitCode=1;}
}
