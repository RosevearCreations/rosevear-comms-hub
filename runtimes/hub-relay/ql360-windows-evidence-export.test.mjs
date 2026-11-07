import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const script=readFileSync(new URL('./ql360-windows-evidence-export.ps1',import.meta.url),'utf8');

test('QL-360 has separate actual Ree and Jack owner identities and Windows CI status is inert',()=>{
  assert.match(script,/DESKTOP-AE894KC/);
  assert.match(script,/Templar/);
  assert.match(script,/\$env:USERNAME -ieq 'Ree'/);
  assert.match(script,/\$env:USERNAME -ieq 'jfros'/);
  assert.match(script,/HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY/);
  assert.match(script,/DENY_ONLY_REE_ORIGINAL_SERVER_CAN_EXPORT_PRIVATE_EVIDENCE/);
});

test('QL-360 requires the genuine original 340C STOP witness, private listener and gateway both OFF',()=>{
  assert.match(script,/ql340c\.stop-witness\.v1/);
  assert.match(script,/FIELD_STOP_OBSERVED_INDEPENDENT_OWNER_REVIEW_REQUIRED/);
  assert.match(script,/\$age -gt 90/);
  assert.match(script,/ql360Evidence/);
  assert.match(script,/ORIGINAL_PRIVATE_RECEIVER_AND_TAILNET_GATEWAY_MUST_BE_OFF/);
  assert.match(script,/Get-NetTCPConnection -LocalPort 8788/);
  assert.match(script,/Get-NetTCPConnection -LocalAddress '100\.77\.246\.3' -LocalPort 8443/);
});

test('QL-360 uses only existing owner-limited protected readbacks, never starts or alters receiver',()=>{
  assert.match(script,/ql359-windows-supervised-test\.ps1/);
  assert.match(script,/ql340c-windows-operator\.ps1/);
  assert.match(script,/-Readback/);
  assert.match(script,/-SignedPacketPath/);
  const code=script.split('\n').filter(line=>!line.trim().startsWith('#')).join('\n');
  assert.doesNotMatch(code,/\bStart-Process\b|\bStop-Process\b|\bSet-NetFirewall\b|\bALTER ROLE\b|\bGRANT\b|\bINSERT INTO\b/i);
  assert.doesNotMatch(code,/\)\s+-(?:StoreCredential|Start|Stop)\b/);
});
