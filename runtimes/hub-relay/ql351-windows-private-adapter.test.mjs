import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const script=readFileSync(new URL('./ql351-windows-private-adapter.ps1',import.meta.url),'utf8');

test('QL-351 staging is original-host-only, requires owner consent and never overwrites existing keys',()=>{
  assert.match(script,/DESKTOP-AE894KC/);
  assert.match(script,/\$ql351WindowsHost/);
  assert.doesNotMatch(script,/\$isWindows\b/i);
  assert.match(script,/Assert-OriginalHost/);
  assert.match(script,/STAGE_QL351_ORIGINAL_WINDOWS/);
  assert.match(script,/DENY_EXISTING_ADAPTER_INSTALLATION_NO_OVERWRITE/);
  assert.match(script,/FileMode\]::CreateNew/);
  assert.match(script,/refs\/remotes\/origin\/main/);
  assert.match(script,/HOLD_REQUIRES_CLEAN_CURRENT_ORIGIN_MAIN_CHECKOUT/);
  assert.doesNotMatch(script,/(?:Stop-Process|Set-ScheduledTask|New-ScheduledTask|tailscale\.exe\s+serve\s+(?:on|reset)|Set-Content\s+Env:DATABASE_URL)/i);
});

test('QL-351 installation binds local source hashes and checks exact provenance before owner actions',()=>{
  assert.match(script,/Get-FileHash.*SHA256/);
  assert.match(script,/HOLD_ADAPTER_INSTALLED_SOURCE_HASH_DRIFT/);
  assert.match(script,/HOLD_ADAPTER_PROVENANCE_OR_INSTALLATION_DRIFT/);
  assert.match(script,/HOLD_ADAPTER_ACL_NOT_PRIVATE/);
  assert.match(script,/STAGED_ONLY_NO_RECEIVER_OR_TRUST/);
  assert.match(script,/DISCONNECTED \/ HOLD/);
});

test('QL-351 delegates real acceptance checks to existing fail-closed Windows operator',()=>{
  for(const command of ['-OwnerPreflight','-Readback','-VerifyOneReceipt','-Start']){
    assert.ok(script.includes(`$operator ${command}`),`Delegates ${command}`);
  }
  assert.match(script,/HOLD_STOP_RECEIVER_BEFORE_PRIVATE_READBACK_OR_PREFLIGHT/);
  assert.match(script,/signedHandshakeProved = \$false/);
  assert.doesNotMatch(script,/AUTHENTICATED_PRIVATE_OPERATOR|connectionState\s*=\s*['"]CONNECTED/);
});
