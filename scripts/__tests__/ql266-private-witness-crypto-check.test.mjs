import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {verifyQl266WitnessCryptography} from '../ql266-private-witness-crypto-check.mjs';

const SCHEMA='rosevear-comms-ql266-witness-crypto/v1';
function fixture(nowMs=Date.now()){
  // Ephemeral synthetic CI key, never exported or accepted as real custody.
  const {privateKey,publicKey}=generateKeyPairSync('ed25519');
  const spki=publicKey.export({format:'der',type:'spki'});
  const pin=createHash('sha256').update(spki).digest('hex');
  const receipt={schema:SCHEMA,source:'rosiedazzlers',
    sourceCommitSha:'a5bd0ded1044a8ce5a0f394fa2266a1e1e495c6c',
    issuedAt:new Date(nowMs).toISOString(),
    nonceBase64url:Buffer.alloc(24,17).toString('base64url'),
    publicSpkiDerBase64:spki.toString('base64'),signatureBase64url:''};
  const message=[receipt.schema,receipt.source,receipt.sourceCommitSha,
    receipt.issuedAt,receipt.nonceBase64url].join('\n');
  receipt.signatureBase64url=sign(null,Buffer.from(message),privateKey).toString('base64url');
  return {receipt,pin,nowMs};
}

test('synthetic Ed25519 possession proof can verify but human roles and network authorization always HOLD',()=>{
  const {receipt,pin,nowMs}=fixture();
  const result=verifyQl266WitnessCryptography(receipt,pin,nowMs);
  assert.equal(result.cryptographicPossession,'SIGNATURE_VALID_ONLY');
  assert.equal(result.publicPin,'PIN_MATCHED');
  assert.equal(result.independentlyAuthenticatedHumanRoles,'NOT_VERIFIED');
  assert.equal(result.originalSignedSourceProofB,'NOT_AVAILABLE');
  assert.equal(result.authenticatedGatewayGets,0);
  assert.equal(result.conditionalTestSlot,'HELD_UNSCHEDULED');
});

test('tampering, untrusted pin, replay-age and extra claims fail closed',()=>{
  const {receipt,pin,nowMs}=fixture();
  assert.equal(verifyQl266WitnessCryptography({...receipt,source:'yw'},pin,nowMs).cryptographicPossession,'NOT_VERIFIED');
  assert.equal(verifyQl266WitnessCryptography(receipt,'0'.repeat(64),nowMs).reason,'INDEPENDENT_PIN_MISMATCH');
  assert.equal(verifyQl266WitnessCryptography(receipt,pin,nowMs+301_000).reason,'CHALLENGE_OUTSIDE_FIVE_MINUTE_WINDOW');
  assert.equal(verifyQl266WitnessCryptography({...receipt,ownerApproved:true},pin,nowMs).reason,'INVALID_OR_UNTRUSTED_INPUT');
});
