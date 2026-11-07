/** QL-361: independently audited ORIGINAL private TEST archive to an offline,
 * owner-controlled six-source candidate handoff. Server-side only: the source
 * apps remain disconnected and no candidate is itself an authorization.
 *
 * The injected original-host storage, PostgreSQL, STOP observer, auditor pin
 * and custody callbacks MUST come from separate trusted backends, not from
 * a browser request or caller-supplied JSON. All database calls are SELECTs.
 */
import {createHash,createPublicKey,timingSafeEqual,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {validateSixHeldPeers} from './ql341-private-readback.mjs';
import {QL360_SCHEMA,consumeQl360VerifiedArchiveForAudit}
  from './ql360-original-evidence-archive.mjs';

export const QL361_SCHEMA='rosevear.hub.ql361.archived-chain-redaction-handoff.v1';
export const QL361_AUDIT_SCHEMA='rosevear.hub.ql361.independent-redaction-audit.v1';
const SHA=/^[0-9a-f]{64}$/;
const hash=data=>createHash('sha256').update(canonicalize(data)).digest('hex');
const equalSha=(a,b)=>SHA.test(a??'')&&SHA.test(b??'')&&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const keysExact=(value,keys)=>value!==null&&typeof value==='object'&&
  !Array.isArray(value)&&Object.keys(value).sort().join('|')===keys.slice().sort().join('|');
const held=(state,extra={})=>({schema:QL361_SCHEMA,state,
  archivedOriginalChainVerified:false,independentRedactionAuditVerified:false,
  ownerControlledHandoffVerified:false,candidateCount:0,
  connected:false,connectedCount:0,receiverActivated:false,
  customerCommunications:false,deviceActions:false,databaseWrites:0,
  sourceRepositoryWrites:0,connectionState:'DISCONNECTED / HOLD',...extra});

const archiveKeys=['schema','kind','sessionId','deviceId','signedTranscriptSha256',
  'externallyPinnedWitnessSpkiSha256','closeoutAt','shutdownObservedAt',
  'receiptCount','revocationCount','receiverListenerCount',
  'tailnetGatewayListenerCount','authenticatedDatabaseRole','peerCount',
  'connectedCount','sources','customerCommunications','deviceActions'];
const sourceKeys=['id','kind','sourceRepository','state'];

/** Deterministic, credential-free material for the external auditor to sign.
 * Producing the report is NOT verification or owner approval. */
export function buildQl361RedactionReport({archiveId,archiveSha256,peers}={}){
  if(!/^[A-Za-z0-9._-]{8,160}$/.test(archiveId??'')||
    !SHA.test(archiveSha256??'')||!Array.isArray(peers)||peers.length!==6)
    throw Error('HOLD_EXACT_ORIGINAL_AUDITOR_REPORT_FIELDS_REQUIRED');
  return {schema:QL361_AUDIT_SCHEMA,archiveId,archiveSha256,
    peerCount:6,connectedCount:0,
    reviewedSourceIds:peers.map(p=>p.peerId).sort(),
    auditedRootFields:archiveKeys.slice().sort(),
    auditedSourceFields:sourceKeys.slice().sort(),
    unexpectedFields:[],credentialsIncluded:false,customerDataIncluded:false,
    deviceActionsIncluded:false};
}

function verifyArchiveShape(evidence,proof,peers){
  if(!keysExact(evidence,archiveKeys)||evidence.schema!==QL360_SCHEMA||
    evidence.kind!=='ORIGINAL_POST_TEST_PRIVATE_EVIDENCE_ONLY'||
    evidence.deviceId!=='rosevear-windows-hub'||
    evidence.sessionId!==proof.sessionId||
    !equalSha(evidence.signedTranscriptSha256,proof.transcriptSha256)||
    !equalSha(evidence.externallyPinnedWitnessSpkiSha256,proof.witnessSpkiSha256)||
    evidence.receiptCount!==1||evidence.revocationCount!==0||
    evidence.receiverListenerCount!==0||evidence.tailnetGatewayListenerCount!==0||
    evidence.authenticatedDatabaseRole!=='ql340c_private_receiver'||
    evidence.peerCount!==6||evidence.connectedCount!==0||
    evidence.customerCommunications!==false||evidence.deviceActions!==false||
    !Number.isFinite(Date.parse(evidence.closeoutAt??''))||
    !Number.isFinite(Date.parse(evidence.shutdownObservedAt??''))||
    !Array.isArray(evidence.sources)||evidence.sources.length!==6)
    return false;
  const expected=peers.map(peer=>({id:peer.peerId,kind:peer.kind,
    sourceRepository:peer.repository,state:'HOLD'}))
    .sort((a,b)=>a.id.localeCompare(b.id));
  const actual=evidence.sources;
  if(actual.some(source=>!keysExact(source,sourceKeys)))return false;
  return canonicalize(actual)===canonicalize(expected);
}

/** Reusable strict redaction shape check for subsequent PRIVATE readbacks.
 * It validates schema/held contents, not original issuer identity on its own. */
export function validateQl361ArchivedEvidenceForHeldPeers({evidence,peers}={}){
  if(!evidence||!Array.isArray(peers)||peers.length!==6)return false;
  return verifyArchiveShape(evidence,{
    sessionId:evidence.sessionId,
    transcriptSha256:evidence.signedTranscriptSha256,
    witnessSpkiSha256:evidence.externallyPinnedWitnessSpkiSha256},peers);
}

/** Public-safe document shape; private original storage MUST rehash it. */
export function validateQl361HandoffShape(document){
  if(!keysExact(document,['schema','kind','archiveId','archiveSha256',
    'redactionAuditSha256','independentAuditorSpkiSha256','auditAttestation',
    'receiverStopped','connectedCount','candidateCount','candidates',
    'customerCommunications','deviceActions','nextAction'])||
    document.schema!==QL361_SCHEMA||document.kind!=='OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY'||
    !/^[A-Za-z0-9._-]{8,160}$/.test(document.archiveId??'')||
    !SHA.test(document.archiveSha256??'')||
    !SHA.test(document.redactionAuditSha256??'')||
    !SHA.test(document.independentAuditorSpkiSha256??'')||
    document.receiverStopped!==true||document.connectedCount!==0||
    document.candidateCount!==6||document.customerCommunications!==false||
    document.deviceActions!==false||
    document.nextAction!=='SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED'||
    !Array.isArray(document.candidates)||document.candidates.length!==6||
    !keysExact(document.auditAttestation,['payload','signature']))return false;
  const audit=document.auditAttestation;
  if(!keysExact(audit.payload,['schema','role','audience','scope','archiveId',
    'archiveSha256','redactionReportSha256','issuedAt','expiresAt'])||
    audit.payload.schema!==QL361_AUDIT_SCHEMA||
    audit.payload.role!=='redaction_auditor'||
    audit.payload.audience!=='rosevear-comms-hub:original-archive:TEST'||
    audit.payload.scope!=='independent-redaction-review-owner-handoff-only'||
    audit.payload.archiveId!==document.archiveId||
    audit.payload.archiveSha256!==document.archiveSha256||
    audit.payload.redactionReportSha256!==document.redactionAuditSha256||
    !/^[A-Za-z0-9_-]{86}$/.test(audit.signature??'')||
    !Number.isFinite(Date.parse(audit.payload.issuedAt??''))||
    !Number.isFinite(Date.parse(audit.payload.expiresAt??'')))return false;
  const seen=new Set();
  for(const candidate of document.candidates){
    if(!keysExact(candidate,['peerId','peerKind','repository','state',
      'sourceTestAuthorized','customerDataAllowed','requestedScope'])||
      typeof candidate.peerId!=='string'||seen.has(candidate.peerId)||
      candidate.state!=='AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE'||
      candidate.sourceTestAuthorized!==false||candidate.customerDataAllowed!==false||
      candidate.requestedScope!=='HEALTH_READ_ONLY_TEST_PROPOSAL_NOT_AUTHORIZATION')
      return false;
    seen.add(candidate.peerId);
  }
  try{
    const peers=validateSixHeldPeers(document.candidates.map(c=>({
      peer_id:c.peerId,peer_kind:c.peerKind,source_repo:c.repository,
      connection_state:'HOLD',source_test_authorized:c.sourceTestAuthorized,
      customer_data_allowed:c.customerDataAllowed})));
    return peers.length===6;
  }catch{return false;}
}

async function verifyIndependentAudit({attestation,proof,reportSha256,
  resolvePinnedAuthority,verifyIndependentCustody,now}){
  const body=attestation?.payload;
  if(attestation?.schema!==QL361_AUDIT_SCHEMA||
    !keysExact(body,['schema','role','audience','scope','archiveId',
      'archiveSha256','redactionReportSha256','issuedAt','expiresAt'])||
    body.schema!==QL361_AUDIT_SCHEMA||body.role!=='redaction_auditor'||
    body.audience!=='rosevear-comms-hub:original-archive:TEST'||
    body.scope!=='independent-redaction-review-owner-handoff-only'||
    body.archiveId!==proof.archiveId||
    !equalSha(body.archiveSha256,proof.evidenceSha256)||
    !equalSha(body.redactionReportSha256,reportSha256)||
    !/^[A-Za-z0-9_-]{86}$/.test(attestation.signature??'')||
    !Number.isFinite(Date.parse(body.issuedAt??''))||
    !Number.isFinite(Date.parse(body.expiresAt??''))||
    body.issuedAt!==new Date(Date.parse(body.issuedAt)).toISOString()||
    body.expiresAt!==new Date(Date.parse(body.expiresAt)).toISOString()||
    Date.parse(body.issuedAt)>now+5_000||Date.parse(body.expiresAt)<=now||
    Date.parse(body.expiresAt)-Date.parse(body.issuedAt)>600_000)
    return null;
  const pin=await resolvePinnedAuthority('redaction_auditor');
  if(pin?.role!=='redaction_auditor'||!SHA.test(pin.spkiSha256??'')||
    equalSha(pin.spkiSha256,proof.witnessSpkiSha256)||
    typeof pin.publicKeyPem!=='string'||pin.publicKeyPem.length>2000)return null;
  const key=createPublicKey(pin.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519'||
    !equalSha(createHash('sha256').update(key.export({type:'spki',format:'der'}))
      .digest('hex'),pin.spkiSha256))return null;
  const custody=await verifyIndependentCustody({role:'redaction_auditor',
    spkiSha256:pin.spkiSha256,requestSha256:reportSha256});
  if(custody?.role!=='redaction_auditor'||custody.authenticated!==true||
    custody.revoked!==false||!equalSha(custody.spkiSha256,pin.spkiSha256)||
    !equalSha(custody.requestSha256,reportSha256))return null;
  const sig=Buffer.from(attestation.signature,'base64url');
  if(sig.length!==64||!verify(null,Buffer.from(canonicalize(body)),key,sig))
    return null;
  return {auditorSpkiSha256:pin.spkiSha256,
    auditAttestation:{payload:body,signature:attestation.signature}};
}

/** A QL-360 one-use in-process proof, fresh original-only DB+STOP readback,
 * strict redaction field audit and independently pinned signed auditor receipt
 * are ALL prerequisites. Failed attempts consume the proof. A positive result
 * does not approve a single source TEST and NEVER starts a receiver. */
export async function verifyQl361ArchivedTestAndPrepareHandoff({originalArchive,
  readOriginalPrivateArchive,query,observeOriginalShutdown,
  auditAttestation,resolvePinnedAuthority,verifyIndependentCustody,
  writeOriginalPrivateHandoff,readOriginalPrivateHandoff,
  now=Date.now()}={}){
  if(![readOriginalPrivateArchive,query,observeOriginalShutdown,
    resolvePinnedAuthority,verifyIndependentCustody,
    writeOriginalPrivateHandoff,readOriginalPrivateHandoff]
    .every(fn=>typeof fn==='function')||!Number.isFinite(now))
    return held('HOLD_ORIGINAL_READBACK_INDEPENDENT_AUDITOR_AND_OWNER_STORE_REQUIRED');
  const proof=consumeQl360VerifiedArchiveForAudit({archive:originalArchive,now});
  if(!proof)return held('HOLD_GENUINE_UNREPLAYED_QL360_ARCHIVE_CAPABILITY_REQUIRED');
  try{
    const [readback,stop,identity,enrollment,count,revocations,peerRows]=await Promise.all([
      readOriginalPrivateArchive({archiveId:proof.archiveId,
        expectedSha256:proof.evidenceSha256}),
      observeOriginalShutdown({sessionId:proof.sessionId,
        transcriptSha256:proof.transcriptSha256}),
      query('SELECT current_user AS receiver_role'),
      query(`SELECT device_id,workload_id,key_id,enrollment_state
        FROM public.master_hub_device_enrollments_ql339b
        WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
          AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`),
      query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338'),
      query(`SELECT count(revocation_id)::int AS count FROM public.master_hub_device_revocations_ql339b
        WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe' AND key_id='hub-ql339b'`),
      query(`SELECT peer_id,peer_kind,source_repo,connection_state,
        source_test_authorized,customer_data_allowed FROM public.master_hub_private_peers_ql341`)
    ]);
    if(readback?.state!=='ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED'||
      readback.originalComputer!=='DESKTOP-AE894KC'||readback.originalUser!=='Ree'||
      readback.ownerOnlyAcl!==true||readback.archiveId!==proof.archiveId||
      !equalSha(readback.sha256,proof.evidenceSha256)||
      !equalSha(hash(readback.evidence),proof.evidenceSha256))
      return held('HOLD_ORIGINAL_OWNER_ONLY_ARCHIVE_BYTES_CHANGED_OR_UNAVAILABLE');
    if(stop?.state!=='ORIGINAL_REE_ALL_PRIVATE_RECEIVERS_OFF_RECHECK'||
      stop.originalComputer!=='DESKTOP-AE894KC'||stop.originalUser!=='Ree'||
      stop.sessionId!==proof.sessionId||
      stop.transcriptSha256!==proof.transcriptSha256||
      stop.receiverListenerCount!==0||stop.tailnetGatewayListenerCount!==0||
      !Number.isFinite(stop.observedAt)||stop.observedAt>now+5_000||
      now-stop.observedAt>30_000)
      return held('HOLD_ORIGINAL_PRIVATE_RECEIVER_STOP_RECHECK_MISSING');
    if(identity.rows?.[0]?.receiver_role!=='ql340c_private_receiver'||
      enrollment.rows?.length!==1||
      enrollment.rows[0].device_id!=='rosevear-windows-hub'||
      enrollment.rows[0].workload_id!=='hub-probe'||
      enrollment.rows[0].key_id!=='hub-ql339b'||
      enrollment.rows[0].enrollment_state!=='REVIEWED_TEST'||
      count.rows?.[0]?.count!==1||revocations.rows?.[0]?.count!==0||
      !Array.isArray(peerRows.rows)||peerRows.rows.length!==6)
      return held('HOLD_ORIGINAL_TEST_RECEIPT_ENROLLMENT_OR_PEER_DRIFT');
    const peers=validateSixHeldPeers(peerRows.rows);
    if(!verifyArchiveShape(readback.evidence,proof,peers))
      return held('DENY_ARCHIVED_TEST_CHAIN_MISMATCH_OR_REDACTION_EXTRA_FIELDS');

    const report=buildQl361RedactionReport({archiveId:proof.archiveId,
      archiveSha256:proof.evidenceSha256,peers});
    const reportSha256=hash(report);
    const audit=await verifyIndependentAudit({attestation:auditAttestation,
      proof,reportSha256,resolvePinnedAuthority,verifyIndependentCustody,now});
    if(!audit)return held('HOLD_INDEPENDENT_PINNED_SIGNED_REDACTION_AUDIT_REQUIRED',{
      archiveSha256:proof.evidenceSha256,redactionReportSha256:reportSha256});

    const handoff={schema:QL361_SCHEMA,kind:'OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY',
      archiveId:proof.archiveId,archiveSha256:proof.evidenceSha256,
      redactionAuditSha256:reportSha256,
      independentAuditorSpkiSha256:audit.auditorSpkiSha256,
      auditAttestation:audit.auditAttestation,
      receiverStopped:true,connectedCount:0,candidateCount:6,
      candidates:peers.map(p=>({peerId:p.peerId,peerKind:p.kind,
        repository:p.repository,
        state:'AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE',
        sourceTestAuthorized:false,customerDataAllowed:false,
        requestedScope:'HEALTH_READ_ONLY_TEST_PROPOSAL_NOT_AUTHORIZATION'})),
      customerCommunications:false,deviceActions:false,
      nextAction:'SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED'};
    if(!validateQl361HandoffShape(handoff))
      return held('DENY_SIX_SOURCE_HANDOFF_SCOPE_OR_SCHEMA');
    const handoffSha256=hash(handoff);
    const written=await writeOriginalPrivateHandoff({handoff,handoffSha256,
      mode:'OWNER_ONLY_CREATE_NEW',originalComputer:'DESKTOP-AE894KC'});
    if(written?.state!=='ORIGINAL_REE_QL361_HANDOFF_WRITTEN_NEW'||
      written.originalComputer!=='DESKTOP-AE894KC'||
      written.originalUser!=='Ree'||written.ownerOnlyAcl!==true||
      written.atomicCreateNew!==true||
      written.sha256!==handoffSha256||
      !/^[A-Za-z0-9._-]{8,160}$/.test(written.handoffId??''))
      return held('HOLD_ORIGINAL_OWNER_ONLY_CANDIDATE_WRITE_NOT_VERIFIED');
    const check=await readOriginalPrivateHandoff({handoffId:written.handoffId,
      expectedSha256:handoffSha256});
    if(check?.state!=='ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED'||
      check.originalComputer!=='DESKTOP-AE894KC'||check.originalUser!=='Ree'||
      check.ownerOnlyAcl!==true||check.handoffId!==written.handoffId||
      !equalSha(check.sha256,handoffSha256)||
      !equalSha(hash(check.handoff),handoffSha256)||
      canonicalize(check.handoff)!==canonicalize(handoff))
      return held('HOLD_PRIVATE_CANDIDATE_READBACK_CHANGED_OR_UNVERIFIED');
    return held('ORIGINAL_TEST_ARCHIVE_INDEPENDENTLY_AUDITED_SIX_OWNER_CANDIDATES_HELD',{
      archivedOriginalChainVerified:true,independentRedactionAuditVerified:true,
      ownerControlledHandoffVerified:true,candidateCount:6,
      handoffId:written.handoffId,handoffSha256,redactionReportSha256:reportSha256,
      nextAction:'Each application independently supplies an exact fresh source-owner signed TEST decision; keep all six HELD'});
  }catch{return held('HOLD_ORIGINAL_ARCHIVED_CHAIN_REDACTION_OR_AUDIT_UNAVAILABLE');}
}

export function ql361Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('ORIGINAL_TEST_AUDIT_OWNER_GUIDE_ONLY',{
    commands:['--help'],privateKeyAccess:false,networkRequests:0,
    receiverStarts:0,sourcePermissionChanges:0});
  throw Error('DENY_UNSUPERVISED_QL361_ORIGINAL_TRUST_OR_SIX_APP_ACTIVATION');
}
if(process.argv[1]?.endsWith('ql361-archived-chain-audit.mjs')){
  try{process.stdout.write(JSON.stringify(ql361Cli())+'\n');}
  catch(error){process.stderr.write(`HOLD_QL361: ${error.message}\n`);process.exitCode=1;}
}
