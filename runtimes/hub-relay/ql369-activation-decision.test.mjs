import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ql369ActivationCli} from './ql369-owner-activation-cli.mjs';
import {createQl369ActivationIntent,inspectQl369ActivationIntent}
  from './ql369-activation-decision.mjs';

test('QL-369 offline CLI help is inert and names separate explicit activation signing steps',async()=>{
  const value=await ql369ActivationCli(['--help']);
  assert.equal(value.membershipActivated,false);
  assert.equal(value.privateTestAuthorized,false);
  assert.equal(value.sourceConnectionsAllowed,false);
  assert.equal(value.connectionState,'DISCONNECTED / HOLD');
  assert.equal(value.commands.length,5);
  assert.ok(value.commands.some(c=>c.includes('--sign')));
});

test('QL-369 nonoriginal CI/Linux cannot perform ANY enrollment signing or assembly',async()=>{
  if(process.platform!=='win32')for(const command of ['--prepare','--inspect','--sign','--assemble','--inspect-signed']){
    await assert.rejects(ql369ActivationCli([command]),/DENY_QL369_NONORIGINAL_WINDOWS_OWNER_HOST/);
  }
});

test('QL-368 evidence-only object never creates an explicit activation approval',()=>{
  assert.throws(()=>createQl369ActivationIntent({signedEvidence:{
    schema:'rosevear.hub.ql368.two-original-owner-evidence.v1',
    ownerMembershipActivated:false,privateTestAuthorized:false,connected:false}}),
  /DENY_QL369_PINNED_QL368_EVIDENCE_FIRST/);
  assert.equal(inspectQl369ActivationIntent({activationIntent:{},signedEvidence:{}}).valid,false);
});

test('original signer runtime has no hosted DB client, SQL write or network activation path',()=>{
  const cli=readFileSync(new URL('./ql369-owner-activation-cli.mjs',import.meta.url),'utf8');
  const signing=readFileSync(new URL('./ql369-activation-decision.mjs',import.meta.url),'utf8');
  assert.match(cli,/DATABASE_URL\|\|process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(cli,/process\.stdin\.isTTY/);
  assert.match(signing,/APPROVE_ONE_TIME_TWO_MASTER_OWNER_MEMBERSHIP_ACTIVATION_ONLY/);
  assert.doesNotMatch(cli+signing,/\bfetch\s*\(|\.rpc\s*\(|client\.from\s*\(/);
});
