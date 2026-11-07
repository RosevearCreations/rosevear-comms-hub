import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const script=readFileSync(new URL('./ql358-windows-original-field.ps1',import.meta.url),'utf8');

test('QL-358 original Ree and Jack accounts are distinct and CI status is inert',()=>{
  assert.match(script,/DESKTOP-AE894KC/);
  assert.match(script,/Templar/);
  assert.match(script,/\$env:USERNAME -ieq 'Ree'/);
  assert.match(script,/\$env:USERNAME -ieq 'jfros'/);
  assert.match(script,/HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY/);
  assert.doesNotMatch(script,/\$IsWindows\s*=/i);
});

test('QL-358 uses actual original local public candidates and QL-356 public digest verifier',()=>{
  assert.match(script,/OwnerAuthorities/);
  assert.match(script,/\$ql358Role/);
  assert.match(script,/ql356-original-field-readback\.mjs/);
  assert.match(script,/--inspect-request/);
  assert.match(script,/DENY_JACK_MUST_NOT_IMPORT_REE_ORIGINAL_WITNESS_FILES/);
});

test('QL-358 never provisions or starts receiver; original proof and DPAPI remain in preexisting guard',()=>{
  assert.match(script,/ql357-windows-owner-activation\.ps1/);
  assert.match(script,/ql340c-windows-operator\.ps1 -StoreCredential/);
  assert.match(script,/HOLD_EXTERNAL_PIN_CUSTODY_AND_DATABASE_ENROLLMENT_FIRST/);
  assert.match(script,/HOLD_ORIGINAL_SIGNED_ENROLLMENT_PINS_AND_REE_DPAPI_CREDENTIAL_REQUIRED/);
  assert.doesNotMatch(script.split('\n').filter(line=>!line.trim().startsWith('#')).join('\n'),
    /\bStart-Process\b|\bStop-Process\b|\bSet-NetFirewall\b|\bGRANT\b|\bALTER ROLE\b|\bINSERT INTO\b/i);
  assert.doesNotMatch(script,/& \(Join-Path \$PSScriptRoot 'ql340c-windows-operator\.ps1'\) -StoreCredential/);
});
