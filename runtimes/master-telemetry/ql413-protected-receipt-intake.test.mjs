import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl412DurableReplayLedger} from './ql412-protected-enrollment.mjs';
import {reviewQl413ThreeMasterReceipts,resolveQl413Connection}
  from './ql413-protected-receipt-intake.mjs';

const sources=['ai-data-platform','rosevear-comms-hub','rosevear-ai-hub'];
const revisions={'ai-data-platform':'69355a853f10bbe4d3785bcede8b44e0c788be65',
  'rosevear-comms-hub':'e42ffa856595a2d24c634653d83b1d80f2d6eaa4',
  'rosevear-ai-hub':'27b234337f5a3f041dfca4541e33ed6aa821fa4f'};
const keys=Object.fromEntries(sources.map(s=>[s,generateKeyPairSync('ed25519')]));
const pins=Object.fromEntries(sources.map(s=>[s,keys[s].publicKey.export({type:'spki',format:'der'}).toString('base64')]));
const issuedAt='2026-11-10T20:00:00.000Z',nowMs=Date.parse('2026-11-10T20:01:00.000Z');
const evidence=()=>({installedRelease:'VERIFIED',persistentHistory:'VERIFIED',
  signedTelemetry:'VERIFIED',replayProtection:'VERIFIED',incidentAcceptance:'VERIFIED'});
const receipt=(s)=>{const payload={schema:'rosevear.master360.protected-receipt.v1',
  sourceId:s,hostId:s==='rosevear-ai-hub'?'DESKTOP-AE894KC':'PROTECTED_MASTER_RUNTIME',
  revision:revisions[s],issuedAt,receiptId:`receipt_ql413_${s.replaceAll('-','_')}`,
  evidence:evidence()};return {payload,
    signature:sign(null,Buffer.from(JSON.stringify(payload)),keys[s].privateKey).toString('base64')};};
const receipts=()=>sources.map(receipt);
const ledger=()=>openQl412DurableReplayLedger(mkdtempSync(join(tmpdir(),'ql413-intake-')));
const config=(store)=>({pins,expectedRevisions:revisions,nowMs,protectedReplayLedger:store,
  ownerSessionApproved:true,independentReviewerApproved:true});

test('QL413 cryptographically verifies all three receipts but never self-authorizes connection',()=>{
  const model=reviewQl413ThreeMasterReceipts(receipts(),config(ledger()));
  assert.equal(model.state,'SIGNED_RECEIPTS_REVIEWED');
  assert.equal(model.verifiedReceipts.length,3);
  assert.equal(model.telemetry,'CLAIMED_VERIFIED_PENDING_INDEPENDENT_RUNTIME_REVIEW');
  assert.equal(model.connection,'HOLD');
  assert.equal(model.receiver,'OFF');
  assert.equal(resolveQl413Connection(model,{ownerApproval:true,independentRuntimeAttestation:true}).connection,'HOLD');
});
test('QL413 rejects wrong source revision, foreign host, modified evidence and stale receipts',()=>{
  const changed=receipts();changed[2].payload.hostId='TEMPLAR';
  assert.equal(reviewQl413ThreeMasterReceipts(changed,config(ledger())).state,'HOLD');
  const tampered=receipts();tampered[1].payload.evidence.signedTelemetry='HOLD';
  assert.equal(reviewQl413ThreeMasterReceipts(tampered,config(ledger())).reason,'SIGNED_RECEIPT_REJECTED');
  assert.equal(reviewQl413ThreeMasterReceipts(receipts(),{...config(ledger()),nowMs:nowMs+600000}).state,'HOLD');
  assert.equal(reviewQl413ThreeMasterReceipts(receipts().slice(0,2),config(ledger())).state,'HOLD');
});
test('QL413 durable duplicate receipt intake is rejected after process reopen',()=>{
  const directory=mkdtempSync(join(tmpdir(),'ql413-replay-'));
  assert.equal(reviewQl413ThreeMasterReceipts(receipts(),config(openQl412DurableReplayLedger(directory))).state,
    'SIGNED_RECEIPTS_REVIEWED');
  assert.equal(reviewQl413ThreeMasterReceipts(receipts(),config(openQl412DurableReplayLedger(directory))).reason,
    'REPLAYED_MASTER_RECEIPT');
});
test('QL413 missing independent pins, reviewer and real deployment cannot open slave gate',()=>{
  assert.equal(reviewQl413ThreeMasterReceipts(receipts(),{...config(ledger()),pins:{}}).connection,'HOLD');
  const model=reviewQl413ThreeMasterReceipts(receipts(),{...config(ledger()),
    independentReviewerApproved:false});
  assert.equal(model.ownerGate,'HOLD');
  assert.equal(model.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
});
