import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
const path=new URL('./ql354-windows-owner-handoff.ps1',import.meta.url);
const code=readFileSync(path,'utf8');

test('QL-354 distinct original Ree and Jack host and user identities stay mandatory',()=>{
  assert.match(code,/DESKTOP-AE894KC/);
  assert.match(code,/\$env:USERNAME -ieq 'Ree'/);
  assert.match(code,/Templar/);
  assert.match(code,/\$env:USERNAME -ieq 'jfros'/);
  assert.match(code,/HOLD_JACK_MASTER_REVIEW_ONLY_REE_ORIGINAL_INTAKE_REQUIRED/);
  assert.match(code,/source\.private\.pem/);
  assert.match(code,/master\.private\.pem/);
  assert.match(code,/ql354-original-owner-intake\.mjs/);
});
test('QL-354 cannot activate a service, load credentials or grant database authority',()=>{
  assert.match(code,/Get-NetTCPConnection/);
  assert.match(code,/DISCONNECTED \/ HOLD/);
  assert.match(code,/receiverActivated=\$false/);
  assert.match(code,/sourceRepositoryWrites=0/);
  assert.doesNotMatch(code,/Start-Process|Stop-Process|Invoke-RestMethod|Invoke-WebRequest|New-NetFirewallRule|Set-NetFirewallRule|Set-Content|WriteAllBytes|ConvertTo-SecureString|DATABASE_URL/);
});
test('nonoriginal CI PowerShell runner observes HOLD without local owner effects',()=>{
  // The default CI Windows runner also executes the PowerShell -Status branch.
  assert.match(code,/HOLD_INDEPENDENT_ORIGINAL_OWNER_WINDOWS_HOST_REQUIRED_NO_ACTION/);
  const shell=spawnSync('pwsh',['-Version'],{encoding:'utf8'});
  if(shell.status!==0)return;
  const result=spawnSync('pwsh',['-NoProfile','-File',new URL(path).pathname,'-Status'],
    {encoding:'utf8'});
  if(process.platform!=='win32')assert.match(result.stdout,/HOLD_INDEPENDENT_ORIGINAL_OWNER_WINDOWS_HOST_REQUIRED_NO_ACTION/);
});
