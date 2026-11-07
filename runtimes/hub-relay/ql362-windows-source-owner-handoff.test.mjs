import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const script=readFileSync(new URL('./ql362-windows-source-owner-handoff.ps1',import.meta.url),'utf8');

test('QL-362 Windows field entry is original Ree/Jack status only, candidate stays Ree private',()=>{
  assert.match(script,/DESKTOP-AE894KC/);
  assert.match(script,/TEMPLAR/);
  assert.match(script,/HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY/);
  assert.match(script,/DENY_QL362_CANDIDATE_REQUIRES_ORIGINAL_REE_ACCOUNT/);
  assert.match(script,/DENY_QL362_JACK_CANNOT_READ_REE_PRIVATE_HANDOFF/);
  assert.match(script,/Ql361Handoff/);
  assert.match(script,/Get-FileHash -LiteralPath \$path -Algorithm SHA256/);
  assert.match(script,/sourceOwnerSignedPermissionVerified=\$false/);
  assert.match(script,/masterOwnerSignedPermissionVerified=\$false/);
});

test('QL-362 status/owner candidate readback cannot launch receiver, send GET or change a role',()=>{
  const commands=script.split('\n').filter(line=>!line.trim().startsWith('#')).join('\n');
  assert.doesNotMatch(commands,/\bStart-Process\b|\bStop-Process\b|\bInvoke-WebRequest\b|\bInvoke-RestMethod\b|\bSet-NetFirewall\b|\bALTER ROLE\b|\bINSERT INTO\b|\bGRANT\s+(?:SELECT|INSERT|UPDATE|ALL)\b/i);
  assert.match(commands,/Get-NetTCPConnection -LocalPort 8788/);
  assert.match(commands,/Get-NetTCPConnection -LocalAddress '100\.77\.246\.3' -LocalPort 8443/);
  assert.match(commands,/connected=\$false/);
});
