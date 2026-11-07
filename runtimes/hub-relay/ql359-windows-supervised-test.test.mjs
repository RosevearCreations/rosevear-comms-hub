import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const script=readFileSync(new URL('./ql359-windows-supervised-test.ps1',import.meta.url),'utf8');

test('QL-359 restricts original field actions to actual Ree/Jack accounts',()=>{
  assert.match(script,/DESKTOP-AE894KC/);
  assert.match(script,/Templar/);
  assert.match(script,/\$env:USERNAME -ieq 'Ree'/);
  assert.match(script,/\$env:USERNAME -ieq 'jfros'/);
  assert.match(script,/HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY/);
  assert.match(script,/DENY_JACK_MUST_NOT_IMPORT_REE_ORIGINAL_WITNESS_FILES/);
});

test('QL-359 never creates owner authority or credentials, grants role or starts listener',()=>{
  assert.match(script,/ql358-windows-original-field\.ps1/);
  assert.match(script,/ql340c-database\.dpapi/);
  assert.match(script,/Get-NetTCPConnection -LocalPort 8788/);
  assert.match(script,/STOP_ORIGINAL_RECEIVER_BEFORE_FIELD_RECONCILIATION/);
  const commands=script.split('\n').filter(line=>!line.trim().startsWith('#')).join('\n');
  assert.doesNotMatch(commands,/\bStart-Process\b|\bStop-Process\b|\bInvoke-WebRequest\b|\bSet-NetFirewall\b|\bALTER ROLE\b|\bGRANT\b|\bINSERT INTO\b/i);
  assert.doesNotMatch(commands,/-StoreCredential|-Start\b|-Stop\b/);
});
