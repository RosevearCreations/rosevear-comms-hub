import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { QL244_RELEASE, QL244_SYSTEMS } from '../ql244-witnessed-handshake-review.mjs';
import { ql241PublicKeyFingerprint } from '../ql241-external-gateway-retrieval.mjs';
import { QL245_RELEASE, QL245_NEGATIVES, QL245_SYSTEMS, ql245Canonical,
  ql245Digest, inspectQl245Packet } from '../ql245-six-app-evidence-review.mjs';

const NOW=1793000000000;
const keys=Array.from({length:7},()=>generateKeyPairSync('ed25519'));
const pub=key=>key.publicKey.export({format:'pem',type:'spki'});
const pin=key=>ql241PublicKeyFingerprint(pub(key));
const signed=(kind,payload,key)=>({
  payload,signature:sign(null,ql245Canonical(kind,payload),key.privateKey).toString('base64url')
});
function valid() {
  const summary={
    release:QL244_RELEASE,status:'TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD',
    reason:'Local claim only',company:'devilndove',assessorSignatureChecked:true,
    conditionalOwnerRequestSignatureChecked:true,witnessedSourceIndependentlyConfirmed:false,
    credentialExchangeIndependentlyConfirmed:false,ownerIdentityIndependentlyConfirmed:false,
    actualOwnerAuthorization:false,conditionalPilotDecision:'CONDITIONAL_REVIEW_REQUEST_ONLY_HELD',
    actualConnection:'DISCONNECTED',actualWrites:0,calls:0,sms:0,providerDispatch:0,
    realPilotHolds:12,gatewayAuditId:'np-gateway-audit-001',
    identityAttestationId:'np-identity-attestation-001',
    assessorReceiptId:'np-assessor-receipt-001',sourceRevision:'a'.repeat(40),
    gatewayPublicKeyFingerprintSha256:'a'.repeat(64),
    ownerPublicKeyFingerprintSha256:'b'.repeat(64),
    witnessPublicKeyFingerprintSha256:'c'.repeat(64),
    assessorPublicKeyFingerprintSha256:'d'.repeat(64),
    credentialMetadata:QL244_SYSTEMS.map((system,i)=>({
      system,keyId:'np-ql244-key-'+(i+1),
      receiptId:'np-ql244-receipt-'+(i+1),
      review:'OWNER_APPROVAL_NOT_GIVEN_HELD'
    }))
  };
  const trusted={sources:QL245_SYSTEMS.map((system,i)=>({
    system,publicKeyFingerprintSha256:pin(keys[i]),
    businessId:system==='ai-data-platform'?'devilndove':system,
    tenantId:system==='yw'?'np-yard-rosevear-tenant-001':
      system==='icamp'?'np-camp-rosevear-tenant-001':null
  })),assessor:pin(keys[6])};
  const returns=QL245_SYSTEMS.map((system,i)=>{
    const p={
      schema_version:'rosevear.integration.v1',source_system:system,
      signer_key_id:'np-signer-key-'+(i+1),
      business_id:trusted.sources[i].businessId,tenant_id:trusted.sources[i].tenantId,
      environment:'nonproduction',source_revision:i===1?'a'.repeat(40):String(i+1).repeat(40),
      ci_run_url:'https://github.com/RosevearCreations/rosevear-comms-hub/actions/runs/'+(9500+i),
      key_id:'np-credential-key-'+(i+1),
      registry_receipt_id:'np-registry-receipt-'+(i+1),
      health_receipt_id:'np-health-receipt-'+(i+1),
      capabilities_receipt_id:'np-capabilities-receipt-'+(i+1),
      gateway_audit_id:i===1?'np-gateway-audit-001':'np-app-audit-'+(i+1),
      allowed_paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
      scope:['read_health','read_capabilities'],
      negative_tests:Object.fromEntries(QL245_NEGATIVES.map(n=>[n,true])),
      source_receipt_id:'np-source-receipt-'+(i+1),
      audit_storage_review:'INDEPENDENT_RESTART_PROOF_PENDING',
      owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED',
      issued_at:NOW-10000,expires_at:NOW+100000
    };
    return {system,publicKeyPem:pub(keys[i]),envelope:signed('source',p,keys[i])};
  });
  const ap={
    schema_version:'rosevear.integration.v1',issuer:'rosevear-independent-six-app-assessor',
    kind:'six_app_signed_metadata_review',ql244_assessor_receipt_id:summary.assessorReceiptId,
    ql244_source_revision:summary.sourceRevision,
    six_source_payloads_sha256:ql245Digest(returns.map(r=>r.envelope.payload)),
    review_receipt_id:'np-six-app-review-receipt-001',business_id:'devilndove',
    tenant_id:null,environment:'nonproduction',real_world_witness_confirmed:false,
    owner_pilot_authorized:false,rollback_verified:false,
    issued_at:NOW-10000,expires_at:NOW+100000
  };
  return {packet:{ql244Summary:summary,returns,assessor:{
    publicKeyPem:pub(keys[6]),envelope:signed('assessor',ap,keys[6])
  }},trusted};
}
const inspect=(v,now=NOW)=>inspectQl245Packet(v.packet,v.trusted,now);
function resignSource(v,index) {
  v.packet.returns[index].envelope=signed('source',v.packet.returns[index].envelope.payload,keys[index]);
  v.packet.assessor.envelope.payload.six_source_payloads_sha256=
    ql245Digest(v.packet.returns.map(r=>r.envelope.payload));
  v.packet.assessor.envelope=signed('assessor',v.packet.assessor.envelope.payload,keys[6]);
}
function resignAssessor(v){
  v.packet.assessor.envelope=signed('assessor',v.packet.assessor.envelope.payload,keys[6]);
}
describe('QL-245 six-app independently pinned public claims stay held',()=>{
  it('matches seven distinct signatures, six tenant-scoped sources, yet never gives owner release',()=>{
    const v=valid(),res=inspect(v);
    assert.equal(res.status,'SEVEN_PUBLIC_SIGNATURES_MATCHED_REAL_PROOF_PENDING_HELD');
    assert.equal(res.release,QL245_RELEASE);assert.equal(res.sourceSignatureChecks,6);
    assert.equal(res.sourceMetadata.length,6);assert.equal(res.assessorSignatureChecked,true);
    assert.equal(res.ownerPilotAuthorized,false);assert.equal(res.connectionState,'DISCONNECTED');
    assert.equal(res.realPilotHolds,12);assert.equal(res.externalReadIndependentlyConfirmed,false);
    assert.equal(res.credentialExchangeIndependentlyConfirmed,false);
    assert.equal(res.calls+res.sms+res.dispatch+res.writes,0);
  });
  it('rejects unsigned packet or assessor forgery',()=>{
    const v=valid();v.packet.assessor.envelope.signature='A'.repeat(86);
    assert.equal(inspect(v).status,'DENIED_ASSESSOR_SIGNATURE');
    const w=valid();w.trusted.assessor=w.trusted.sources[0].publicKeyFingerprintSha256;
    assert.equal(inspect(w).status,'DENIED_ASSESSOR_PIN');
  });
  it('rejects swapped or forged source signature, pin and reused source signer',()=>{
    const v=valid();v.packet.returns[2].envelope.signature='B'.repeat(86);
    assert.equal(inspect(v).status,'DENIED_SOURCE_SIGNATURE');
    const w=valid();w.trusted.sources[3].publicKeyFingerprintSha256='f'.repeat(64);
    assert.equal(inspect(w).status,'DENIED_SOURCE_SIGNATURE');
    const u=valid();u.trusted.sources[3].publicKeyFingerprintSha256=u.trusted.sources[2].publicKeyFingerprintSha256;
    assert.equal(inspect(u).status,'DENIED_SOURCE_SIGNATURE');
  });
  it('rejects cross-company/campground tenant despite a newly signed claim',()=>{
    const v=valid();v.packet.returns[4].envelope.payload.tenant_id='np-foreign-campground-001';
    resignSource(v,4);assert.equal(inspect(v).status,'DENIED_SOURCE_EVIDENCE');
    const w=valid();w.trusted.sources[4].tenantId=null;
    assert.equal(inspect(w).status,'DENIED_TENANT_SCOPE');
    const u=valid();u.packet.returns[1].envelope.payload.business_id='rosiedazzlers';
    resignSource(u,1);assert.equal(inspect(u).status,'DENIED_SOURCE_EVIDENCE');
  });
  it('rejects wrong source SHA, gateway audit ID, missing evidence and query paths',()=>{
    const cases=[
      p=>{p.source_revision='b'.repeat(40);},
      p=>{p.gateway_audit_id='np-bad-audit-001';},
      p=>{p.allowed_paths[0]+='?all=true';},
      p=>{p.negative_tests.write_denied=false;},
      p=>{p.audit_storage_review='INDEPENDENTLY_VERIFIED';}
    ];
    for(const mutate of cases){const v=valid();mutate(v.packet.returns[1].envelope.payload);
      resignSource(v,1);assert.equal(inspect(v).status,'DENIED_SOURCE_EVIDENCE');}
  });
  it('rejects actual owner authorization, connected state, expired/altered review and fake rollback',()=>{
    for(const mutate of [
      p=>{p.owner_authorization='APPROVED';},
      p=>{p.connection_state='CONNECTED';},
      p=>{p.expires_at=NOW-1;}
    ]){const v=valid();mutate(v.packet.returns[0].envelope.payload);
      resignSource(v,0);assert.equal(inspect(v).status,'DENIED_SOURCE_EVIDENCE');}
    const owner=valid();owner.packet.assessor.envelope.payload.owner_pilot_authorized=true;
    resignAssessor(owner);assert.equal(inspect(owner).status,'DENIED_ASSESSOR_SCOPE');
    const rollback=valid();rollback.packet.assessor.envelope.payload.rollback_verified=true;
    resignAssessor(rollback);assert.equal(inspect(rollback).status,'DENIED_ASSESSOR_SCOPE');
  });
  it('rejects QL-244 conditional review omission or unsafe metadata instead of inventing consent',()=>{
    const v=valid();v.packet.ql244Summary.actualOwnerAuthorization=true;
    assert.equal(inspect(v).status,'DENIED_PACKET');
    const w=valid();w.packet.ql244Summary.credentialMetadata[0]=null;
    assert.equal(inspect(w).status,'DENIED_PACKET');
  });
  it('rejects changed assessor digest, missing registered source and extra secret data',()=>{
    const v=valid();v.packet.assessor.envelope.payload.six_source_payloads_sha256='0'.repeat(64);
    resignAssessor(v);assert.equal(inspect(v).status,'DENIED_ASSESSOR_SCOPE');
    const w=valid();w.packet.returns.pop();assert.equal(inspect(w).status,'DENIED_PACKET');
    const x=valid();x.packet.returns[1].envelope.payload.secret='never';
    assert.equal(inspect(x).status,'DENIED_SOURCE_SIGNATURE');
  });
  it('signed digest covers ordered source identity, receipt and negative denial fields',()=>{
    const v=valid();const p=v.packet.returns.map(r=>r.envelope.payload);
    const h=ql245Digest(p);assert.match(h,/^[a-f0-9]{64}$/);
    const changed=structuredClone(p);changed[2].negative_tests.write_denied=false;
    assert.notEqual(h,ql245Digest(changed));
    assert.throws(()=>ql245Digest([...p].reverse()));
  });
});
