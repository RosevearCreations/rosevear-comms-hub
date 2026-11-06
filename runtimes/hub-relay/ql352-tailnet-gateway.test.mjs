import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {renderQl352HoldCaddyfile,verifyQl352HoldCaddyfile,
  verifyQl352OriginalTlsPair,ql352Cli,ORIGINAL_GATEWAY} from './ql352-tailnet-gateway.mjs';

const cert='C:\\Users\\Ree\\AppData\\Local\\RosevearAIHub\\CommsRelay\\TLS\\comms-ql340b.crt';
const key='C:\\Users\\Ree\\AppData\\Local\\RosevearAIHub\\CommsRelay\\TLS\\comms-ql340b.key';

test('QL-352 generates a Tailscale-only Caddyfile, never a private broker or original LAN replacement',()=>{
  const config=renderQl352HoldCaddyfile({certificatePath:cert,privateKeyPath:key});
  assert.match(config,/https:\/\/desktop-ae894kc\.tailc43957\.ts\.net:8443/);
  assert.match(config,/bind 100\.77\.246\.3/);
  assert.match(config,/tls "C:\/Users\/Ree\/AppData\/Local\/RosevearAIHub\/CommsRelay\/TLS\/comms-ql340b\.crt"/);
  assert.match(config,/admin off/);
  assert.match(config,/auto_https off/);
  assert.match(config,/HOLD_NO_AUTHENTICATED_PRIVATE_OPERATOR" 503/);
  assert.match(config,/DENY_UNENROLLED_COMMS_BRIDGE" 403/);
  assert.doesNotMatch(config,/reverse_proxy|basicauth|basic_auth|tls internal|192\.168\.68\.74|:8788|:9443|0\.0\.0\.0|:8765/);
  const valid=verifyQl352HoldCaddyfile(config,{certificatePath:cert,privateKeyPath:key});
  assert.equal(valid.state,'STAGED_TAILNET_ONLY_DENY_ALL_GATEWAY_CONFIG_VERIFIED');
  assert.equal(valid.connectedCount,0);
  assert.equal(valid.originalLanServiceUnchanged,true);
});

test('QL-352 refuses changed routes, wildcard exposure, extra auth bypass and unsafe TLS paths',()=>{
  const args={certificatePath:cert,privateKeyPath:key};
  const config=renderQl352HoldCaddyfile(args);
  for(const mutation of [config.replace('bind 100.77.246.3','bind 0.0.0.0'),
    config.replace('DENY_UNENROLLED_COMMS_BRIDGE','CONNECTED'),
    config+'\nreverse_proxy 127.0.0.1:8788',config.replace('503','200')]){
    assert.match(verifyQl352HoldCaddyfile(mutation,args).state,/^HOLD_/);
  }
  for(const path of ['../comms-ql340b.crt','C:\\temp\\key.crt',
    'C:\\Users\\Ree\\RosevearAIHub\\CommsRelay\\TLS\\bad\n.crt',
    'C:\\Users\\Ree\\RosevearAIHub\\CommsRelay\\TLS\\bad".crt']){
    assert.throws(()=>renderQl352HoldCaddyfile({certificatePath:path,privateKeyPath:key}));
  }
  assert.throws(()=>renderQl352HoldCaddyfile({certificatePath:cert,privateKeyPath:cert}));
});

test('QL-352 does not treat synthetic TLS material or fake cert digest as original authority',()=>{
  const {privateKey}=generateKeyPairSync('ed25519');
  const privateKeyBytes=privateKey.export({type:'pkcs8',format:'pem'});
  const result=verifyQl352OriginalTlsPair({certificateBytes:Buffer.from('fake-cert'.repeat(20)),
    privateKeyBytes:Buffer.from(privateKeyBytes)});
  assert.equal(result.state,'HOLD_CERTIFICATE_ROTATED_REQUIRES_INDEPENDENT_REPIN');
  assert.equal(result.connectedCount,0);
  assert.equal(result.originalIssuerIndependentlyAuthenticated,undefined);
  assert.match(ql352Cli(['--help']).commands.join(' '),/--verify-cert/);
  assert.throws(()=>ql352Cli(['--start']),/DENY_QL352/);
  assert.equal(ORIGINAL_GATEWAY.receiverPort,8788);
});

test('QL-352 does not issue credentials, approve owners, open ports or write to source apps',()=>{
  const source=readFileSync(new URL('./ql352-tailnet-gateway.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/(?:createServer|listen\(|spawn\(|exec\(|UPDATE public\.|INSERT INTO|ALTER ROLE|writeFileSync|unlinkSync)/);
  assert.match(source,/privateKeyExported:false/);
  assert.match(source,/connectionState:'DISCONNECTED \/ HOLD'/);
});
