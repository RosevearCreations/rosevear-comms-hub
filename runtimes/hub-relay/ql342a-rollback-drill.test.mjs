import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectInertDrillDocument,ql342aCli,runInertLoopbackDrill} from './ql342a-rollback-drill.mjs';
import {reviewOwnerEnrollment} from './ql342-owner-decision.mjs';

test('isolated loopback drill starts, challenges and stops only its own inert child',async()=>{
  const record=await runInertLoopbackDrill({computer:'SYNTHETIC_TEST_RUNNER'});
  assert.equal(record.loopbackAddress,'127.0.0.1');
  assert.notEqual(record.loopbackPort,8788);
  assert.equal(record.exactInertChallengeVerified,true);
  assert.equal(record.inertProcessExitObserved,true);
  assert.equal(record.loopbackPortClosedAfterStop,true);
  assert.equal(record.originalReceiverStopped,false);
  assert.equal(record.databaseCredentialsRead,false);
  assert.equal(record.originalOwnerSignaturesCreated,false);
  assert.equal(record.databaseEnrollmentCreated,false);
  assert.equal(record.customerCommunications,false);
  assert.equal(record.deviceActions,false);
  assert.equal(record.connected,false);
  assert.deepEqual(inspectInertDrillDocument(record,{expectedComputer:'SYNTHETIC_TEST_RUNNER'}),{
    state:'INERT_ROLLBACK_DRILL_DOCUMENT_FORMAT_VALID_NOT_INDEPENDENT_WITNESS',
    validDrillDocument:true,originalReceiverStopped:false,originalFieldWitnessApproved:false,
    connected:false,stoppedInertPid:record.stoppedInertPid,loopbackPort:record.loopbackPort,
    independentHumanReviewRequired:true});
  assert.equal(inspectInertDrillDocument(record,{expectedComputer:'DESKTOP-AE894KC'}).validDrillDocument,false);
  for(const alteration of [
    {originalReceiverStopped:true},
    {originalReceiverPortUsed:true},
    {databaseCredentialsRead:true},
    {originalOwnerSignaturesCreated:true},
    {databaseEnrollmentCreated:true},
    {customerCommunications:true},
    {deviceActions:true},
    {connected:true},
    {loopbackPort:8788},
    {loopbackAddress:'0.0.0.0'},
    {stoppedInertPid:0},
    {loopbackPortClosedAfterStop:false},
    {stoppedAt:'2040-01-01T00:00:00.000Z'}]){
    assert.equal(inspectInertDrillDocument({...record,...alteration}).validDrillDocument,false,
      `Invalid or elevated drill claim must be rejected: ${Object.keys(alteration)[0]}`);
  }
});

test('no receiver, original owner signature, DB authorization or trusted field witness is conferred',()=>{
  const witness={schema:'rosevear.hub.ql342a.inert-rollback-drill.v1',
    state:'INERT_LOOPBACK_PROCESS_STOPPED_OWNER_REVIEW_REQUIRED',
    computer:'DESKTOP-AE894KC',startedAt:new Date().toISOString(),stoppedAt:new Date().toISOString(),
    stoppedInertPid:100,loopbackAddress:'127.0.0.1',loopbackPort:50001,
    inertChildSha256:'a'.repeat(64),challengeSha256:'b'.repeat(64),
    exactInertChallengeVerified:true,inertProcessExitObserved:true,loopbackPortClosedAfterStop:true,
    originalReceiverStopped:false,originalReceiverPortUsed:false,databaseCredentialsRead:false,
    originalOwnerSignaturesCreated:false,databaseEnrollmentCreated:false,
    customerCommunications:false,deviceActions:false,connected:false};
  assert.equal(inspectInertDrillDocument(witness).validDrillDocument,true);
  assert.equal(inspectInertDrillDocument(witness).originalFieldWitnessApproved,false);
  const attempted=reviewOwnerEnrollment({rollbackRecord:witness});
  assert.equal(attempted.approved,false);
  assert.equal(attempted.connected,false);
});

test('non-interactive CLI does not run a field drill on CI or other hosts',async()=>{
  assert.deepEqual((await ql342aCli(['--help'])).commands,['--run','--inspect OWNER_DRILL_JSON']);
  await assert.rejects(ql342aCli(['--run'],{COMPUTERNAME:'CI-RUNNER',LOCALAPPDATA:'/tmp'}),
    /HOLD_ORIGINAL_WINDOWS_OWNER_AND_NO_DATABASE_CREDENTIAL_REQUIRED/);
  await assert.rejects(ql342aCli(['--run'],{COMPUTERNAME:'DESKTOP-AE894KC',LOCALAPPDATA:'/tmp',DATABASE_URL:'synthetic'}),
    /HOLD_ORIGINAL_WINDOWS_OWNER_AND_NO_DATABASE_CREDENTIAL_REQUIRED/);
  await assert.rejects(ql342aCli(['--start'],{}),/DENY_UNSUPERVISED_ROLLBACK_ACTION/);
});

test('PowerShell route is gated by exact host, real receiver OFF, Tailscale Serve OFF and no DB credential',()=>{
  const script=readFileSync(fileURLToPath(new URL('./ql340c-windows-operator.ps1',import.meta.url)),'utf8');
  const route=script.slice(script.indexOf('if ($RollbackDrill) {'),script.indexOf('if ($OwnerPreflight) {'));
  assert.match(route,/DESKTOP-AE894KC/);
  assert.match(route,/Get-ReceiverListeners/);
  assert.match(route,/DATABASE_URL/);
  assert.match(route,/No serve config/);
  assert.match(route,/evidenceDir/);
  assert.match(route,/\& node \$inertDrillFile --run/);
  assert.doesNotMatch(route,/Stop-Process|serverFile|Start-Process|-StoreCredential/);
});
