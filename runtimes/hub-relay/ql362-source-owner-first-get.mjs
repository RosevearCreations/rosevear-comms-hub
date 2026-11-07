/** QL-362 — original Ree-private, per-source signed one-GET TEST authority.
 * Requires a real QL-361 owner-ACL handoff + separately pinned auditor, exact
 * independently signed source and master owner decisions, restricted live
 * Postgres/STOP readback, and an atomic one-use private operation claim.
 * No browser/CLI authorization; no customer, device or source write action.
 */
import {createHash,createPublicKey,timingSafeEqual,verify} from 'node:crypto';
import {canonicalize,inspectManifest,SOURCES} from '../master-discovery/manifest.mjs';
import {validateSixHeldPeers} from './ql341-private-readback.mjs';
import {QL360_SCHEMA} from './ql360-original-evidence-archive.mjs';
import {QL361_AUDIT_SCHEMA,validateQl361HandoffShape,
  validateQl361ArchivedEvidenceForHeldPeers,buildQl361RedactionReport}
  from './ql361-archived-chain-audit.mjs';

export const QL362_SCHEMA='rosevear.hub.ql362.source-owner-one-get.v1';
export const QL362_APPROVAL_SCHEMA='rosevear.hub.ql362.exact-source-owner-approval.v1';
export const QL362_HEALTH_SCHEMA='rosevear.hub.ql362.source-health-receipt.v1';
const SHA=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const hash=data=>createHash('sha256').update(canonicalize(data)).digest('hex');
const equalSha=(a,b)=>SHA.test(a??'')&&SHA.test(b??'')&&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const keysExact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).sort().join('|')===keys.slice().sort().join('|');
const held=(state,extra={})=>({schema:QL362_SCHEMA,state,
  originalArchivedTestVerified:false,sourceOwnerSignatureVerified:false,
  masterOwnerSignatureVerified:false,privateOperationClaimed:false,
  firstSourceGetVerified:false,connected:false,connectedCount:0,
  sourceTestAuthorized:false,customerDataAllowed:false,
  customerCommunications:false,deviceActions:false,sourceRepositoryWrites:0,
  connectionState:'DISCONNECTED / HOLD',retryAutomatically:false,...extra});
const SOURCE_PATH='/api/integration/v1/shell/health';
const originOK=origin=>{
  if(typeof origin!=='string'||origin.length>250)return false;
  try{const url=new URL(origin);return url.protocol==='https:'&&
    url.origin===origin&&url.pathname==='/'&&!url.username&&!url.password&&
    !url.search&&!url.hash;}catch{return false;}
};

/** Safe unsigned form for each owner to sign OFFLINE; it is never authority. */
export function createQl362OfflineGetRequest({handoff,sourceId,operationId,
  pinnedSource,issuedAt=Date.now()}={}){
  if(!validateQl361HandoffShape(handoff)||!Object.hasOwn(SOURCES,sourceId)||
    !UUID.test(operationId??'')||!Number.isFinite(issuedAt)||
    !Number.isSafeInteger(issuedAt)||
    !/^[a-f0-9]{40}$/.test(pinnedSource?.commitSha??'')||
    !SHA.test(pinnedSource?.manifestSha256??'')||
    !originOK(pinnedSource?.sourceOrigin)||
    pinnedSource.sourceId!==sourceId||
    !handoff.candidates.some(c=>c.peerId===sourceId&&
      c.repository===SOURCES[sourceId].repo&&
      c.sourceTestAuthorized===false))
    throw Error('HOLD_Q362_EXACT_ORIGINAL_SOURCE_INTENT_REQUIRED');
  return Object.freeze({schema:QL362_SCHEMA,kind:'ONE_PRIVATE_HEALTH_GET_INTENT',
    archiveId:handoff.archiveId,handoffSha256:hash(handoff),sourceId,
    repository:SOURCES[sourceId].repo,operationId,
    sourceCommitSha:pinnedSource.commitSha,
    manifestSha256:pinnedSource.manifestSha256,
    sourceOrigin:pinnedSource.sourceOrigin,
    environment:'TEST',method:'GET',path:SOURCE_PATH,
    issuedAt:new Date(issuedAt).toISOString(),
    expiresAt:new Date(issuedAt+90_000).toISOString(),
    customerDataAllowed:false,deviceActionsAllowed:false,
    persistentConnectionAllowed:false});
}

async function verifyPinnedApproval({approval,role,sourceId,requestSha256,
  resolvePinnedAuthority,verifyIndependentCustody,now,disallow=[]}){
  const body=approval?.payload;
  if(approval?.schema!==QL362_APPROVAL_SCHEMA||
    !keysExact(body,['schema','role','sourceId','requestSha256',
      'audience','decision','issuedAt','expiresAt'])||
    body.schema!==QL362_APPROVAL_SCHEMA||body.role!==role||
    body.sourceId!==sourceId||!equalSha(body.requestSha256,requestSha256)||
    body.audience!=='rosevear-comms-hub:source-only-health-get:TEST'||
    body.decision!=='APPROVE_EXACTLY_ONE_SOURCE_HEALTH_GET'||
    !/^[A-Za-z0-9_-]{86}$/.test(approval.signature??'')||
    !Number.isFinite(Date.parse(body.issuedAt??''))||
    !Number.isFinite(Date.parse(body.expiresAt??''))||
    body.issuedAt!==new Date(Date.parse(body.issuedAt)).toISOString()||
    body.expiresAt!==new Date(Date.parse(body.expiresAt)).toISOString()||
    Date.parse(body.issuedAt)>now+5_000||Date.parse(body.expiresAt)<=now||
    Date.parse(body.expiresAt)-Date.parse(body.issuedAt)>90_000)
    return null;
  const pinned=await resolvePinnedAuthority(role,sourceId);
  if(pinned?.role!==role||pinned.sourceId!==sourceId||
    !SHA.test(pinned.spkiSha256??'')||
    disallow.some(digest=>equalSha(digest,pinned.spkiSha256))||
    typeof pinned.publicKeyPem!=='string'||pinned.publicKeyPem.length>2000)
    return null;
  const key=createPublicKey(pinned.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519'||
    !equalSha(createHash('sha256').update(key.export({type:'spki',format:'der'}))
      .digest('hex'),pinned.spkiSha256))return null;
  const custody=await verifyIndependentCustody({role,sourceId,
    spkiSha256:pinned.spkiSha256,requestSha256});
  if(custody?.authenticated!==true||custody?.revoked!==false||
    custody.role!==role||custody.sourceId!==sourceId||
    !equalSha(custody.spkiSha256,pinned.spkiSha256)||
    !equalSha(custody.requestSha256,requestSha256))return null;
  const signature=Buffer.from(approval.signature,'base64url');
  if(signature.length!==64||
    !verify(null,Buffer.from(canonicalize(body)),key,signature))return null;
  return {role,spkiSha256:pinned.spkiSha256};
}

async function verifyIndependentHandoffAudit({handoff,resolvePinnedAuthority,
  verifyIndependentCustody,now}){
  const attestation=handoff.auditAttestation,body=attestation.payload;
  if(body.schema!==QL361_AUDIT_SCHEMA||body.role!=='redaction_auditor'||
    body.archiveId!==handoff.archiveId||
    !equalSha(body.archiveSha256,handoff.archiveSha256)||
    !equalSha(body.redactionReportSha256,handoff.redactionAuditSha256)||
    body.audience!=='rosevear-comms-hub:original-archive:TEST'||
    body.scope!=='independent-redaction-review-owner-handoff-only'||
    Date.parse(body.issuedAt)>now+5_000||Date.parse(body.expiresAt)<=now)
    return null;
  const pinned=await resolvePinnedAuthority('redaction_auditor');
  if(pinned?.role!=='redaction_auditor'||
    !equalSha(pinned.spkiSha256,handoff.independentAuditorSpkiSha256)||
    typeof pinned.publicKeyPem!=='string'||pinned.publicKeyPem.length>2000)
    return null;
  const key=createPublicKey(pinned.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519'||
    !equalSha(createHash('sha256').update(key.export({type:'spki',format:'der'}))
      .digest('hex'),pinned.spkiSha256))return null;
  const custody=await verifyIndependentCustody({role:'redaction_auditor',
    spkiSha256:pinned.spkiSha256,requestSha256:handoff.redactionAuditSha256});
  if(custody?.role!=='redaction_auditor'||custody.authenticated!==true||
    custody.revoked!==false||!equalSha(custody.spkiSha256,pinned.spkiSha256)||
    !equalSha(custody.requestSha256,handoff.redactionAuditSha256))return null;
  const sig=Buffer.from(attestation.signature,'base64url');
  if(sig.length!==64||!verify(null,Buffer.from(canonicalize(body)),key,sig))
    return null;
  return {auditorSpkiSha256:pinned.spkiSha256};
}

/** The caller MUST inject original Windows-only private storage, a trusted
 * pin registry, dedicated PostgreSQL role, one-use persistent claim, source
 * signer and independent witness. One actual GET maximum; NEVER a retry. */
export function createQl362FirstSourceGetGate({readOriginalPrivateHandoff,
  readOriginalPrivateArchive,resolvePinnedAuthority,verifyIndependentCustody,
  resolvePinnedSource,query,verifyOriginalPrivateOperator,
  observeOriginalReceiverOff,claimSingleUseOperation,sendSignedGet,
  verifySignedSourceReceipt,appendIndependentWitness,
  now=()=>Date.now()}={}){
  const spent=new Set();let active=false;
  return Object.freeze({
    async runFirst({handoffId,expectedHandoffSha256,sourceId,operationId,
      request,sourceOwnerApproval,masterOwnerApproval}={}){
      if(active)return held('HOLD_OTHER_SOURCE_GET_IN_PROGRESS');
      if(!Object.hasOwn(SOURCES,sourceId)||!UUID.test(operationId??'')||
        !/^[A-Za-z0-9._-]{8,160}$/.test(handoffId??'')||
        !SHA.test(expectedHandoffSha256??'')||
        !keysExact(request,['schema','kind','archiveId','handoffSha256',
          'sourceId','repository','operationId','sourceCommitSha',
          'manifestSha256','sourceOrigin','environment','method','path',
          'issuedAt','expiresAt','customerDataAllowed',
          'deviceActionsAllowed','persistentConnectionAllowed']))
        return held('DENY_UNREVIEWED_OR_MALFORMED_SOURCE_GET_INTENT');
      if(spent.has(operationId))return held('DENY_REPLAYED_SOURCE_GET_OPERATION');
      spent.add(operationId);active=true;
      try{
        if([readOriginalPrivateHandoff,readOriginalPrivateArchive,
          resolvePinnedAuthority,verifyIndependentCustody,resolvePinnedSource,
          query,verifyOriginalPrivateOperator,observeOriginalReceiverOff,
          claimSingleUseOperation,sendSignedGet,verifySignedSourceReceipt,
          appendIndependentWitness].some(fn=>typeof fn!=='function'))
          return held('HOLD_ORIGINAL_SERVER_SIGNERS_AND_PRIVATE_ADAPTERS_REQUIRED');
        const at=now();
        if(!Number.isFinite(at)||!Number.isSafeInteger(at)||
          request.operationId!==operationId||request.sourceId!==sourceId||
          !Number.isFinite(Date.parse(request.issuedAt??''))||
          !Number.isFinite(Date.parse(request.expiresAt??''))||
          request.issuedAt!==new Date(Date.parse(request.issuedAt)).toISOString()||
          request.expiresAt!==new Date(Date.parse(request.expiresAt)).toISOString()||
          at-Date.parse(request.issuedAt)<0||at-Date.parse(request.issuedAt)>15_000||
          Date.parse(request.expiresAt)<=at||
          Date.parse(request.expiresAt)-Date.parse(request.issuedAt)!==90_000)
          return held('DENY_CHANGED_OR_STALE_EXACT_SOURCE_GET_REQUEST');
        const [original,privateOperator,role,enrollment,count,revocations,peersRows,
          stopped,pinnedSource]=await Promise.all([
          readOriginalPrivateHandoff({handoffId,expectedSha256:expectedHandoffSha256}),
          verifyOriginalPrivateOperator({sourceId,operationId}),
          query('SELECT current_user AS receiver_role'),
          query(`SELECT device_id,workload_id,key_id,enrollment_state
            FROM public.master_hub_device_enrollments_ql339b
            WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
              AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`),
          query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338'),
          query(`SELECT count(revocation_id)::int AS count FROM public.master_hub_device_revocations_ql339b
            WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe' AND key_id='hub-ql339b'`),
          query(`SELECT peer_id,peer_kind,source_repo,connection_state,
            source_test_authorized,customer_data_allowed FROM public.master_hub_private_peers_ql341`),
          observeOriginalReceiverOff({sourceId,operationId}),
          resolvePinnedSource(sourceId)
        ]);
        const handoff=original?.handoff;
        if(original?.state!=='ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED'||
          original.originalComputer!=='DESKTOP-AE894KC'||original.originalUser!=='Ree'||
          original.ownerOnlyAcl!==true||original.handoffId!==handoffId||
          !equalSha(original.sha256,expectedHandoffSha256)||
          !validateQl361HandoffShape(handoff)||
          !equalSha(hash(handoff),expectedHandoffSha256))
          return held('HOLD_VERIFIED_ORIGINAL_OWNER_ONLY_CANDIDATE_REQUIRED');
        const candidate=handoff.candidates.find(x=>x.peerId===sourceId);
        if(!candidate||candidate.repository!==SOURCES[sourceId].repo||
          candidate.sourceTestAuthorized!==false||candidate.customerDataAllowed!==false)
          return held('DENY_SOURCE_NOT_IN_ORIGINAL_HELD_CANDIDATES');
        const archive=await readOriginalPrivateArchive({archiveId:handoff.archiveId,
          expectedSha256:handoff.archiveSha256});
        if(archive?.state!=='ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED'||
          archive.originalComputer!=='DESKTOP-AE894KC'||archive.originalUser!=='Ree'||
          archive.ownerOnlyAcl!==true||archive.archiveId!==handoff.archiveId||
          !equalSha(archive.sha256,handoff.archiveSha256)||
          !equalSha(hash(archive.evidence),handoff.archiveSha256)||
          archive.evidence?.schema!==QL360_SCHEMA||
          archive.evidence?.receiptCount!==1||archive.evidence?.peerCount!==6||
          archive.evidence?.connectedCount!==0)
          return held('HOLD_ORIGINAL_SIGNED_ARCHIVE_READBACK_CHANGED');
        if(privateOperator?.state!=='ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION'||
          privateOperator.originalComputer!=='DESKTOP-AE894KC'||
          privateOperator.replayOrRevocationFound!==false||
          !Number.isFinite(privateOperator.expiresAt)||
          privateOperator.expiresAt<=at||privateOperator.expiresAt>at+90_000)
          return held('HOLD_ORIGINAL_REE_PRIVATE_OPERATOR_SESSION_REQUIRED');
        if(stopped?.state!=='ORIGINAL_REE_ALL_PRIVATE_RECEIVERS_OFF_RECHECK'||
          stopped.originalComputer!=='DESKTOP-AE894KC'||
          stopped.originalUser!=='Ree'||stopped.receiverListenerCount!==0||
          stopped.tailnetGatewayListenerCount!==0||
          !Number.isFinite(stopped.observedAt)||
          Math.abs(at-stopped.observedAt)>30_000)
          return held('HOLD_ORIGINAL_PRIVATE_RECEIVER_SHUTDOWN_REQUIRED');
        if(role.rows?.[0]?.receiver_role!=='ql340c_private_receiver'||
          enrollment.rows?.length!==1||
          enrollment.rows[0].device_id!=='rosevear-windows-hub'||
          enrollment.rows[0].workload_id!=='hub-probe'||
          enrollment.rows[0].key_id!=='hub-ql339b'||
          enrollment.rows[0].enrollment_state!=='REVIEWED_TEST'||
          count.rows?.[0]?.count!==1||revocations.rows?.[0]?.count!==0||
          !Array.isArray(peersRows.rows)||peersRows.rows.length!==6)
          return held('HOLD_ORIGINAL_TEST_OR_SIX_SOURCE_DATABASE_DRIFT');
        const peers=validateSixHeldPeers(peersRows.rows);
        if(peers.length!==6||!peers.some(peer=>peer.peerId===sourceId&&
          peer.repository===candidate.repository))
          return held('HOLD_SOURCE_CANDIDATE_NOT_IN_SIX_HELD_PEERS');
        if(!validateQl361ArchivedEvidenceForHeldPeers({
          evidence:archive.evidence,peers})||
          !equalSha(hash(buildQl361RedactionReport({archiveId:handoff.archiveId,
            archiveSha256:handoff.archiveSha256,peers})),handoff.redactionAuditSha256))
          return held('DENY_ORIGINAL_ARCHIVE_SIX_SOURCE_REDACTION_AUDIT_DRIFT');
        const audit=await verifyIndependentHandoffAudit({handoff,
          resolvePinnedAuthority,verifyIndependentCustody,now:at});
        if(!audit)return held('HOLD_INDEPENDENT_ORIGINAL_REDACTION_AUDIT_REQUIRED');
        if(pinnedSource?.sourceId!==sourceId||
          pinnedSource.repository!==`RosevearCreations/${candidate.repository}`||
          !/^[a-f0-9]{40}$/.test(pinnedSource.commitSha??'')||
          !originOK(pinnedSource.sourceOrigin)||
          pinnedSource.manifest?.source_id!==sourceId||
          inspectManifest(pinnedSource.manifest,pinnedSource.manifestTrustPin).status!==
            'SIGNED_MANIFEST_VERIFIED_SOURCE_GRANT_HELD')
          return held('HOLD_INDEPENDENT_SIGNED_SOURCE_MANIFEST_AND_ORIGIN_REQUIRED');
        const manifestSha256=hash(pinnedSource.manifest);
        const expected=createQl362OfflineGetRequest({handoff,sourceId,
          operationId,pinnedSource:{...pinnedSource,manifestSha256},
          issuedAt:Date.parse(request.issuedAt)});
        if(canonicalize(expected)!==canonicalize(request))
          return held('DENY_GET_INTENT_DOES_NOT_MATCH_PINNED_SOURCE_OR_HANDOFF');
        const requestSha256=hash(request);
        const source=await verifyPinnedApproval({approval:sourceOwnerApproval,
          role:'source_owner',sourceId,requestSha256,
          resolvePinnedAuthority,verifyIndependentCustody,now:at,
          disallow:[audit.auditorSpkiSha256]});
        if(!source)return held('HOLD_INDEPENDENT_SOURCE_OWNER_SIGNED_EXACT_GET_REQUIRED');
        const master=await verifyPinnedApproval({approval:masterOwnerApproval,
          role:'master_owner',sourceId,requestSha256,
          resolvePinnedAuthority,verifyIndependentCustody,now:at,
          disallow:[audit.auditorSpkiSha256,source.spkiSha256]});
        if(!master)return held('HOLD_SEPARATE_MASTER_OWNER_SIGNED_EXACT_GET_REQUIRED');
        const claimed=await claimSingleUseOperation({sourceId,operationId,
          requestSha256,expiresAt:request.expiresAt,
          sourceOwnerSpkiSha256:source.spkiSha256,
          masterOwnerSpkiSha256:master.spkiSha256});
        if(claimed?.state!=='ORIGINAL_PRIVATE_SINGLE_USE_SOURCE_GET_CLAIMED'||
          claimed.sourceId!==sourceId||claimed.operationId!==operationId||
          !equalSha(claimed.requestSha256,requestSha256)||
          claimed.durableUniqueClaim!==true)
          return held('HOLD_INDEPENDENT_DURABLE_ONE_USE_OPERATION_CLAIM_REQUIRED');
        if(now()>Date.parse(request.expiresAt))
          return held('HOLD_SOURCE_GET_EXPIRED_AFTER_ONE_USE_CLAIM');
        // Exactly one call. Private adapter must enforce pinned TLS, path,
        // redirect denial, Ed25519 source signer and no credential URL leak.
        const response=await sendSignedGet({request,requestSha256,
          sourceOwnerSpkiSha256:source.spkiSha256,
          masterOwnerSpkiSha256:master.spkiSha256});
        const body=response?.body;
        if(response?.redirected!==false||response?.httpStatus!==200||
          response?.sourceId!==sourceId||response?.operationId!==operationId||
          response?.sourceOrigin!==request.sourceOrigin||
          response?.method!=='GET'||response?.path!==SOURCE_PATH||
          !Number.isSafeInteger(response?.byteLength)||response.byteLength<1||
          response.byteLength>4096||
          !keysExact(body,['schema','sourceId','operationId','health',
            'connected','customerDataAllowed','deviceActions'])||
          body.schema!==QL362_HEALTH_SCHEMA||body.sourceId!==sourceId||
          body.operationId!==operationId||body.health!=='ok'||
          body.connected!==false||body.customerDataAllowed!==false||
          body.deviceActions!==false)
          return held('DENY_SOURCE_GET_RESPONSE_SCOPE_OR_REDACTION');
        const receiptSha256=hash(body);
        const verified=await verifySignedSourceReceipt({request,
          response,requestSha256,receiptSha256,pinnedSource});
        if(verified?.state!=='INDEPENDENT_PINNED_SOURCE_GET_RECEIPT_VERIFIED'||
          verified.sourceId!==sourceId||verified.operationId!==operationId||
          !equalSha(verified.requestSha256,requestSha256)||
          !equalSha(verified.receiptSha256,receiptSha256)||
          verified.sourceSignerAuthenticated!==true||
          verified.nonproductionIsolationVerified!==true)
          return held('HOLD_INDEPENDENT_SOURCE_SIGNED_RESPONSE_VERIFICATION');
        const witness=await appendIndependentWitness({sourceId,operationId,
          requestSha256,receiptSha256,transportOrigin:request.sourceOrigin});
        if(witness?.state!=='PRIVATE_ONE_SOURCE_APPEND_ONLY_TEST_WITNESS_COMMITTED'||
          witness.sourceId!==sourceId||witness.operationId!==operationId||
          !equalSha(witness.requestSha256,requestSha256)||
          !equalSha(witness.receiptSha256,receiptSha256)||
          witness.immutableReadbackVerified!==true)
          return held('HOLD_INDEPENDENT_IMMUTABLE_SOURCE_TEST_WITNESS_REQUIRED');
        return held('ONE_APPROVED_SOURCE_ONLY_HEALTH_GET_VERIFIED_SIX_APPS_STILL_HELD',{
          originalArchivedTestVerified:true,sourceOwnerSignatureVerified:true,
          masterOwnerSignatureVerified:true,privateOperationClaimed:true,
          firstSourceGetVerified:true,sourceId,operationId,requestSha256,
          receiptSha256,otherPeersHeld:5,
          nextAction:'Independent per-source tenant and persistent-connection review required'});
      }catch{return held('HOLD_ORIGINAL_SOURCE_AUTHORIZATION_OR_GET_VERIFICATION_UNAVAILABLE');}
      finally{active=false;}
    },
    inspect(){return held(active?'ONE_ORIGINAL_SOURCE_GET_ACTIVE':'QL362_GET_GATE_IDLE',{
      attemptedOperations:spent.size,activeCount:active?1:0});}
  });
}

export function ql362Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('ORIGINAL_SOURCE_GET_OWNER_GUIDE_ONLY',{
    commands:['--help'],credentialAccess:false,networkRequests:0,
    receiverStarts:0,sourcePermissionsChanged:0,databaseWrites:0});
  throw Error('DENY_UNSUPERVISED_QL362_LIVE_SOURCE_TEST_OR_PERMISSION_CHANGE');
}
if(process.argv[1]?.endsWith('ql362-source-owner-first-get.mjs')){
  try{process.stdout.write(JSON.stringify(ql362Cli())+'\n');}
  catch(error){process.stderr.write(`HOLD_QL362: ${error.message}\n`);process.exitCode=1;}
}
