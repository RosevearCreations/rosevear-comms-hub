import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {createQl361WindowsPrivateHandoffStore} from './ql361-windows-private-handoff.mjs';
const source=readFileSync(new URL('./ql361-windows-private-handoff.mjs',import.meta.url),'utf8');
const script=readFileSync(new URL('./ql361-windows-owner-audit.ps1',import.meta.url),'utf8');

test('QL-361 private candidate storage is original Ree-only, with ACL and atomic hash readback',()=>{
  if(process.platform!=='win32'||process.env.COMPUTERNAME?.toUpperCase()!=='DESKTOP-AE894KC')
    assert.throws(()=>createQl361WindowsPrivateHandoffStore(),/ONLY_ORIGINAL_REE_WINDOWS/);
  assert.match(source,/userInfo\(\)\.username\.toLowerCase\(\)!=='ree'/);
  assert.match(source,/restrictDirectory\(dir\)/);
  assert.match(source,/flag:'wx',mode:0o600/);
  assert.match(source,/validateQl361HandoffShape\(data\.handoff\)/);
  assert.match(source,/hash\(data\.handoff\)!==expectedSha256/);
  assert.doesNotMatch(source,/DATABASE_URL|service_role|NEXT_PUBLIC_/);
});

test('QL-361 field review is read-only and does not grant access on Jack, CI or Ree',()=>{
  assert.match(script,/DESKTOP-AE894KC/);
  assert.match(script,/TEMPLAR/);
  assert.match(script,/DENY_QL361_ONLY_ORIGINAL_REE_CAN_READ_PRIVATE_ARCHIVE/);
  assert.match(script,/DENY_QL361_JACK_CANNOT_READ_REE_PRIVATE_ARCHIVE/);
  assert.match(script,/HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY/);
  assert.match(script,/Get-FileHash -LiteralPath \$path -Algorithm SHA256/);
  const commands=script.split('\n').filter(line=>!line.trim().startsWith('#')).join('\n');
  assert.doesNotMatch(commands,/\bStart-Process\b|\bStop-Process\b|\bALTER ROLE\b|\bGRANT\s+(?:SELECT|INSERT|UPDATE|ALL)\b|\bINSERT INTO\b|\bSet-NetFirewall\b/i);
});
