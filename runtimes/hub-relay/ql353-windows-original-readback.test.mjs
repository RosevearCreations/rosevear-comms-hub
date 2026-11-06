import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const ps=readFileSync(fileURLToPath(new URL('./ql353-windows-original-readback.ps1',import.meta.url)),'utf8');
test('QL-353 non-original Windows CI host does no work beyond inert status',()=>{
  assert.match(ps,/\$env:COMPUTERNAME -ceq 'DESKTOP-AE894KC'/);
  assert.match(ps,/if \(-not \$original\)/);
  assert.match(ps,/HOLD_ORIGINAL_REE_WINDOWS_HOST_REQUIRED_NO_ACTION/);
  assert.match(ps,/exit 0/);
  assert.doesNotMatch(ps,/\b(?:Start-Process|Stop-Process|New-Item|Set-Content|Add-Content|Out-File|Set-NetFirewallRule|New-NetFirewallRule)\b/i);
});
test('QL-353 never confuses public file presence or TCP listener with trust',()=>{
  assert.match(ps,/originalSignedEnrollmentPresent=/);
  assert.match(ps,/databaseEnrollmentVerified=\$false/);
  assert.match(ps,/signedReceiptVerified=\$false/);
  assert.match(ps,/privateOperatorAuthenticated=\$false/);
  assert.match(ps,/connectionState='DISCONNECTED \/ HOLD'/);
  assert.match(ps,/privateDatabaseCredentialEncryptedOnDisk/);
  assert.match(ps,/originalIssuerIndependentlyApproved=\$false/);
});
