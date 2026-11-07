import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const path=new URL('./ql356-windows-field-handoff.ps1',import.meta.url);
const code=readFileSync(path,'utf8');

test('QL-356 requires genuine original Ree and Jack host/user identities and local owner roles',()=>{
  assert.match(code,/DESKTOP-AE894KC/);
  assert.match(code,/\$env:USERNAME -ieq 'Ree'/);
  assert.match(code,/Templar/);
  assert.match(code,/\$env:USERNAME -ieq 'jfros'/);
  assert.match(code,/ql339b-hub\.public-candidate\.json/);
  assert.match(code,/jack-master\.public-candidate\.json/);
  assert.match(code,/Get-NetTCPConnection/);
  assert.match(code,/PREPARE_QL356_UNSIGNED_TEST_ONLY/);
});

test('QL-356 cannot sign, start/stop services, alter firewall, grant SQL authority or access secrets',()=>{
  assert.match(code,/--inspect-request/);
  assert.match(code,/--prepare/);
  assert.doesNotMatch(code,/--sign\b|--assemble\b|StoreCredential|Start-Process|Stop-Process|Invoke-RestMethod|Invoke-WebRequest|New-NetFirewallRule|Set-NetFirewallRule|DATABASE_URL/);
  assert.doesNotMatch(code,/\$IsWindows\s*=/i);
  assert.match(code,/receiverActivated=\$false/);
  assert.match(code,/DISCONNECTED \/ HOLD/);
});

test('non-original Windows runner can only print HOLD; never prepare an owner request',()=>{
  assert.match(code,/HOLD_NONORIGINAL_CI_HOST_NO_ACTION/);
  const shell=spawnSync('pwsh',['-Version'],{encoding:'utf8'});
  if(shell.status!==0)return;
  const result=spawnSync('pwsh',['-NoProfile','-File',new URL(path).pathname,'-Status'],
    {encoding:'utf8'});
  if(process.platform!=='win32')assert.match(result.stdout,/HOLD_NONORIGINAL_CI_HOST_NO_ACTION/);
});
