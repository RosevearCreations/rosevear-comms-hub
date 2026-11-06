/** QL-342: private Windows TEST custody verifier. Never loaded into the public Worker.
 * An original-owner signature is checked, not minted, delegated or assumed. */
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {verifiedCandidatePins,hashWitnessFiles} from './ql340b-enrollment.mjs';
import {verifyDeviceEnrollment} from './enrollment.mjs';
import {verifySignedTestReceipt} from './ql341-private-readback.mjs';
import {restrictDirectory} from './owner-authority-custody.mjs';

export const QL342_DECISION_SCHEMA='rosevear.hub.ql342.owner-enrollment-review.v1';
export const QL342_RECEIPT_SCHEMA='rosevear.hub.ql342.one-test-receipt.v1';
const sha=data=>createHash('sha256').update(data).digest('hex');
const SHA=/^[a-f0-9]{64}$/;
const fields=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const held=(state,extra={})=>({state,approved:false,receiverActivated:false,
  connected:false,customerCommunications:false,deviceActions:false,...extra});
const readJson=path=>JSON.parse(readFileSync(resolve(path),'utf8'));

/** The hashes and actual Ed25519 signatures can be verified locally; a file's
 * contents still require an independently accountable original field witness. */
export function reviewOwnerEnrollment({enrollment,pins,candidates,evidenceDigests,
  rollbackRecord,now=Date.now()}={}){
  if(!enrollment||!pins||!candidates||!evidenceDigests)
    return held('HOLD_MISSING_ORIGINAL_OWNER_ENROLLMENT_OR_EVIDENCE');
  let trusted;
  try{trusted=verifiedCandidatePins(candidates);}
  catch{return held('DENY_ORIGINAL_PUBLIC_CANDIDATE_MISMATCH');}
  if(trusted.source.keyId!==pins.source?.keyId||
    trusted.source.publicKeyPem!==pins.source?.publicKeyPem||
    trusted.master.keyId!==pins.master?.keyId||
    trusted.master.publicKeyPem!==pins.master?.publicKeyPem||
    trusted.schema!==pins.schema)
    return held('DENY_ORIGINAL_OWNER_PUBLIC_PINS_MISMATCH');
  const p=enrollment.payload;
  if(p?.deviceId!=='rosevear-windows-hub'||p?.workloadId!=='hub-probe'||
    p?.keyId!=='hub-ql339b'||p.deviceSpkiSha256!==candidates.device.deviceSpkiSha256||
    fields.some(k=>!SHA.test(evidenceDigests[k]??'')||evidenceDigests[k]!==p[k]))
    return held('DENY_DEVICE_OR_FOUR_FIELD_EVIDENCE_DIGESTS');
  const verified=verifyDeviceEnrollment(enrollment,pins,now);
  if(!verified.enrolled)return held(verified.state);
  const originalStop=rollbackRecord?.schema==='rosevear.hub.ql340c.stop-witness.v1'&&
    rollbackRecord.state==='FIELD_RECEIVER_STOPPED_REVIEW_REQUIRED'&&
    rollbackRecord.computer==='DESKTOP-AE894KC'&&
    Number.isSafeInteger(rollbackRecord.stoppedPid)&&rollbackRecord.stoppedPid>0&&
    rollbackRecord.receiverListenerCountAfter===0&&
    typeof rollbackRecord.verifiedServerPath==='string'&&
    /[\\/]runtimes[\\/]hub-relay[\\/]server\.mjs$/i.test(rollbackRecord.verifiedServerPath)&&
    Number.isFinite(Date.parse(rollbackRecord.capturedAtUTC??''));
  return held('ORIGINAL_OWNER_SIGNATURES_VALID_FIELD_DECISION_PENDING',{
    schema:QL342_DECISION_SCHEMA,payloadSha256:sha(canonicalize(p)),
    deviceSpkiSha256:p.deviceSpkiSha256,
    originalOwnerSignaturesVerified:true,
    fourCurrentWitnessHashesMatch:true,
    actualReceiverStopDocumentPresent:Boolean(originalStop),
    stopPreflightIsNotActiveStop:true,
    sourceTestAuthorized:false,databaseEnrollmentCreated:false,
    originalWitnessDigests:Object.fromEntries(fields.map(k=>[k,evidenceDigests[k]])),
    enrollmentIssuedAt:p.issuedAt,
    enrollmentExpiresAt:p.expiresAt,
    nextAction:'Independent original field witness and separate private database authorization required'
  });
}

/** Independent database readback proves precisely one original-device TEST
 * receipt; never upgrades the six peer connections or authorizes source calls. */
export async function verifyOneHeldTestReceipt(query,pins,packet,decision,now=Date.now()){
  if(typeof query!=='function'||decision?.schema!==QL342_DECISION_SCHEMA||
    decision.state!=='ORIGINAL_OWNER_SIGNATURES_VALID_FIELD_DECISION_PENDING'||
    decision.originalOwnerSignaturesVerified!==true||
    decision.fourCurrentWitnessHashesMatch!==true||
    decision.sourceTestAuthorized!==false||decision.databaseEnrollmentCreated!==false||
    decision.approved!==false||!SHA.test(decision.payloadSha256??''))
    return held('HOLD_ORIGINAL_OWNER_REVIEW_REQUIRED');
  const role=await query('SELECT current_user AS receiver_role');
  if(role.rows?.[0]?.receiver_role!=='ql340c_private_receiver')
    return held('DENY_UNREVIEWED_DATABASE_IDENTITY');
  // A DB administrator must have independently inserted this reviewed original
  // dual-owner record; merely holding a local signed file is insufficient.
  const stored=await query(`SELECT enrollment_record FROM public.master_hub_device_enrollments_ql339b
    WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
      AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST' LIMIT 2`);
  const storedPayload=stored.rows?.[0]?.enrollment_record?.payload;
  if(stored.rows?.length!==1||!storedPayload||typeof storedPayload!=='object'||
    sha(canonicalize(storedPayload))!==decision.payloadSha256)
    return held('HOLD_INDEPENDENT_DATABASE_ENROLLMENT_MISSING_OR_MISMATCHED');
  const count=await query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
  if(Number(count.rows?.[0]?.count)!==1)
    return held('HOLD_EXACTLY_ONE_IMMUTABLE_TEST_RECEIPT_REQUIRED');
  const witness=await verifySignedTestReceipt(query,pins,packet,now);
  if(!witness.verified)return held(witness.state);
  if(!Number.isFinite(Date.parse(witness.receivedAt))||
    now-Date.parse(witness.receivedAt)>120_000||
    now<Date.parse(witness.receivedAt)-30_000)
    return held('HOLD_SIGNED_TEST_RECEIPT_NOT_FRESH');
  return {schema:QL342_RECEIPT_SCHEMA,
    state:'ORIGINAL_SIGNED_ONE_TEST_RECEIPT_VERIFIED_STILL_HELD',
    verified:true,connected:false,peerConnections:0,
    receiptCount:1,deviceId:witness.deviceId,receivedAt:witness.receivedAt,
    ownerPayloadSha256:decision.payloadSha256,
    sourceTestAuthorized:false,customerCommunications:false,deviceActions:false,
    receiverActivated:false};
}

const safeBase=(env=process.env)=>{
  if(process.platform!=='win32'||!env.LOCALAPPDATA)
    throw Error('HOLD_REE_ORIGINAL_WINDOWS_HOST_REQUIRED');
  return join(env.LOCALAPPDATA,'RosevearAIHub','CommsRelay');
};
const paths=base=>({device:join(base,'ql339b-hub.public-candidate.json'),
  source:join(base,'OwnerAuthorities','source','source.public-candidate.json'),
  master:join(base,'Imports','jack-master.public-candidate.json'),
  signed:join(base,'Enrollment','ql340b-signed-test-enrollment.json'),
  pins:join(base,'Enrollment','ql340b-private-owner-public-pins.json'),
  credential:join(base,'Receiver','ql340c-database.dpapi'),
  evidence:join(base,'Evidence')});

export function preflightFileState(base){
  const file=paths(base);
  const candidateFiles=['device','source','master'].map(x=>existsSync(file[x]));
  const signed=existsSync(file.signed),pins=existsSync(file.pins);
  const credential=existsSync(file.credential);
  return {schema:'rosevear.hub.ql342.owner-preflight.v1',
    state:'ORIGINAL_OWNER_CEREMONY_AND_DB_AUTHORITY_REVIEW_REQUIRED',
    candidateFileCount:candidateFiles.filter(Boolean).length,
    evidenceDirectoryPresent:existsSync(file.evidence),
    signedEnrollmentPresent:signed,approvedPublicPinsPresent:pins,
    privateCredentialEncryptedOnDisk:credential,
    databaseEnrollmentVerified:false,oneHeldTestReceiptVerified:false,
    receiverActivated:false,customerCommunications:false,deviceActions:false,
    nextAction:!signed||!pins?'Complete independently reviewed original QL-340B signatures and public pins':
      !credential?'Receive a dedicated, independently authorized private DB credential':'Run supervised independent owner review'};
}

const writeNew=(file,data)=>writeFileSync(file,JSON.stringify(data,null,2)+'\n',
  {flag:'wx',mode:0o600});

export async function ql342Cli(args=process.argv.slice(2),env=process.env){
  if(args.length===1&&args[0]==='--help')return {schema:'rosevear.hub.ql342.cli.v1',
    commands:['--preflight','--review EVIDENCE_PATHS_JSON','--verify-one ORIGINAL_SIGNED_PACKET OWNER_REVIEW_FILE'],
    networkRequests:0,customerCommunications:false,deviceActions:false};
  if(args.length===1&&args[0]==='--preflight')
    return preflightFileState(safeBase(env));
  const base=safeBase(env),file=paths(base);
  if(args.length===2&&args[0]==='--review'){
    for(const key of ['device','source','master','signed','pins'])
      if(!existsSync(file[key]))throw Error('HOLD_ORIGINAL_OWNER_SIGNED_FILES_MISSING');
    const evidencePaths=readJson(args[1]),digests=hashWitnessFiles(evidencePaths);
    const result=reviewOwnerEnrollment({enrollment:readJson(file.signed),
      pins:readJson(file.pins),candidates:{device:readJson(file.device),
        source:readJson(file.source),master:readJson(file.master)},
      evidenceDigests:digests,rollbackRecord:readJson(evidencePaths.rollback)});
    if(result.state!=='ORIGINAL_OWNER_SIGNATURES_VALID_FIELD_DECISION_PENDING')
      throw Error(result.state);
    if(!existsSync(file.evidence))throw Error('HOLD_PRIVATE_EVIDENCE_FOLDER_REQUIRED');
    restrictDirectory(file.evidence);
    const output=join(file.evidence,'ql342-owner-review-'+new Date().toISOString()
      .replace(/[:.]/g,'-')+'.json');
    writeNew(output,result);
    return {...result,reviewFile:output};
  }
  if(args.length===3&&args[0]==='--verify-one'){
    if(!env.DATABASE_URL)throw Error('HOLD_PRIVATE_DATABASE_CREDENTIAL_REQUIRED');
    const [packet,decision]=[readJson(args[1]),readJson(args[2])];
    if(!existsSync(file.pins))throw Error('HOLD_INDEPENDENT_PUBLIC_PINS_REQUIRED');
    const {Pool}=await import('pg');
    const pool=new Pool({connectionString:env.DATABASE_URL,ssl:{rejectUnauthorized:true},
      max:1,connectionTimeoutMillis:5000});
    let result;
    try{result=await verifyOneHeldTestReceipt(pool.query.bind(pool),
      readJson(file.pins),packet,decision);}
    finally{await pool.end();}
    if(!result.verified)throw Error(result.state);
    if(!existsSync(file.evidence))throw Error('HOLD_PRIVATE_EVIDENCE_FOLDER_REQUIRED');
    restrictDirectory(file.evidence);
    const output=join(file.evidence,'ql342-one-test-receipt-'+new Date().toISOString()
      .replace(/[:.]/g,'-')+'.json');
    writeNew(output,result);
    return {...result,receiptFile:output};
  }
  throw Error('DENY_UNKNOWN_OR_UNSUPERVISED_QL342_ACTION');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await ql342Cli())+'\n');}
  catch{process.stderr.write('HOLD_ORIGINAL_OWNER_QL342_REVIEW_NOT_VERIFIED\n');process.exitCode=1;}
}
