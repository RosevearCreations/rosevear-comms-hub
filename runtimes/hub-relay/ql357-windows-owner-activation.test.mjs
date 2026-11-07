import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const script=readFileSync(new URL('./ql357-windows-owner-activation.ps1',import.meta.url),'utf8');

test('QL-357 Windows guide binds original Ree and independent Jack to distinct local accounts',()=>{
  assert.match(script,/DESKTOP-AE894KC/);
  assert.match(script,/Templar/);
  assert.match(script,/\$env:USERNAME -ieq 'Ree'/);
  assert.match(script,/\$env:USERNAME -ieq 'jfros'/);
  assert.match(script,/HOLD_NONORIGINAL_WINDOWS_CI_HOST_NO_ACTION/);
  assert.match(script,/DENY_JACK_CANNOT_EXECUTE_ORIGINAL_REE_PRIVATE_ACTION/);
});

test('QL-357 does not assign PowerShell 7 automatic read-only IsWindows variable',()=>{
  assert.doesNotMatch(script,/\$IsWindows\s*=/i);
  assert.match(script,/\$ql357OnWindows=/);
});

test('QL-357 only reads original signed proof and current-user DPAPI via protected preexisting operators',()=>{
  assert.match(script,/ql354-windows-owner-handoff\.ps1/);
  assert.match(script,/-InspectSigned/);
  assert.match(script,/ql340c-windows-operator\.ps1/);
  assert.match(script,/-Readback/);
  assert.match(script,/-VerifyOneReceipt/);
  assert.match(script,/privateReceiverListenerCount=\$receiver\.Count/);
  assert.doesNotMatch(script,/\b-StoreCredential\b|\b-Start\b|\b-Stop\b|\b-Stage\b|\b-Activate\b/);
  assert.doesNotMatch(script,/Start-Process|Stop-Process|Set-NetFirewall|New-NetFirewall|ALTER\s+ROLE|GRANT\s|INSERT\s+INTO/i);
});

test('QL-357 observes original signed files but never equates presence with approval',()=>{
  assert.match(script,/originalIssuerIndependentlyAuthenticated=\$false/);
  assert.match(script,/databaseEnrollmentVerified=\$false/);
  assert.match(script,/signedTestReceiptVerified=\$false/);
  assert.match(script,/connectionState='DISCONNECTED \/ HOLD'/);
  assert.match(script,/signedOriginalEnrollmentFilePresent=/);
  assert.match(script,/Test-Path -LiteralPath \$credential/);
});
