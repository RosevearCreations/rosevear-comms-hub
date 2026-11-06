import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const script=readFileSync(fileURLToPath(new URL('./ql352-windows-tailnet-gateway.ps1',import.meta.url)),'utf8');

test('QL-352 original host gate and status remain inert on non-original Windows CI hosts',()=>{
  assert.match(script,/\$expectedComputer = 'DESKTOP-AE894KC'/);
  assert.match(script,/\$ql352OriginalWindows = \(\$env:OS -eq 'Windows_NT'/);
  assert.match(script,/if \(\$Status -or -not \(\$Stage -or \$Validate -or \$SupervisedStart -or \$Stop\)\)/);
  assert.match(script,/exit 0\s*}\s*\n\s*Assert-OriginalHost/);
  assert.doesNotMatch(script,/Set-NetFirewallRule|New-NetFirewallRule|tailscale\.exe serve (?:--|https|tcp)/i);
});

test('QL-352 fails closed around original LAN, network identity and existing files',()=>{
  assert.match(script,/\$expectedLan = '192\.168\.68\.74'/);
  assert.match(script,/\$expectedTailnet = '100\.77\.246\.3'/);
  assert.match(script,/\$lanCaddyfile = 'C:\\Users\\Ree\\rosevearaihub\\data\\lan-access\\Caddyfile'/);
  assert.match(script,/Assert-OriginalLanUnchanged/);
  assert.match(script,/Assert-TailnetReadiness/);
  assert.match(script,/HOLD_TAILSCALE_SERVE_MUST_STAY_OFF/);
  assert.match(script,/HOLD_TAILNET_8443_ALREADY_OWNED_NO_OVERWRITE/);
  assert.match(script,/DENY_EXISTING_QL352_GATEWAY_NO_OVERWRITE/);
  assert.match(script,/\[IO\.FileMode\]::CreateNew/);
  assert.match(script,/HOLD_REQUIRES_CLEAN_CURRENT_ORIGIN_MAIN_BEFORE_GATEWAY_STAGING/);
  assert.match(script,/HOLD_REMOTE_PRODUCTION_MAIN_MUST_EQUAL_ORIGINAL_CHECKOUT/);
});

test('QL-352 owner controls do not mint TLS keys or activate privileged connection',()=>{
  assert.match(script,/HOLD_ORIGINAL_LOCAL_TLS_CERT_AND_KEY_REQUIRED_NO_NEW_KEY_GENERATED/);
  assert.match(script,/STAGE_QL352_TAILNET_DENY_ALL/);
  assert.match(script,/START_QL352_TAILNET_HOLD_ONLY/);
  assert.match(script,/STOP_QL352_TAILNET_ONLY/);
  assert.match(script,/\& \$caddyExe validate --config \$configPath --adapter caddyfile/);
  assert.match(script,/\& \$caddyExe run --config \$configPath --adapter caddyfile/);
  assert.match(script,/DENY_NOT_EXACT_QL352_TAILNET_GATEWAY_PROCESS/);
  assert.match(script,/QL352_TAILNET_ONLY_NOT_ORIGINAL_RECEIVER/);
  assert.doesNotMatch(script,/\b(?:New-SelfSignedCertificate|certreq|openssl\s+(?:req|genpkey)|Stop-Service|Restart-Service)\b/i);
});
