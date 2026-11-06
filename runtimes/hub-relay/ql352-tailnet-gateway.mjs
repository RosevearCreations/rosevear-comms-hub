/** QL-352 — original-Windows-only Tailscale HTTPS transport readiness.
 * Emits a deny-by-default Caddyfile, never a public or working Comms bridge.
 * An original Windows owner must separately attest signer, issuer, grants,
 * receiver OFF and a valid separate authentication sidecar before activation.
 */
import {readFileSync} from 'node:fs';
import {X509Certificate,createPrivateKey,createPublicKey,createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const QL352_SCHEMA='rosevear.hub.ql352.tailnet-gateway-hold.v1';
export const ORIGINAL_GATEWAY=Object.freeze({
  windowsHost:'DESKTOP-AE894KC',tailnetIp:'100.77.246.3',lanIp:'192.168.68.74',
  sourceIp:'100.114.56.26',port:8443,receiverPort:8788,
  dns:'desktop-ae894kc.tailc43957.ts.net',
  // Independently observed QL-344 original TLS file digest. New certificate
  // rotation must be approved/pinned in a separate supervised build.
  originalCertificateFileSha256:'bc43943413b8ec4e0cc49c11405e2633f0176b9becc7f9ad924cc2417ae8048f'
});
const held=(state,other={})=>({schema:QL352_SCHEMA,state,
  sourceId:'rosevear-ai-hub',tailnetIp:ORIGINAL_GATEWAY.tailnetIp,
  port:ORIGINAL_GATEWAY.port,connectedCount:0,receiverActivated:false,
  authenticatedPrivateOperator:false,customerCommunications:false,
  deviceActions:false,sourceRepositoryWrites:0,connectionState:'DISCONNECTED / HOLD',...other});

function safeWindowsFilePath(file,extension){
  if(typeof file!=='string'||!/^([a-zA-Z]:\\|[a-zA-Z]:\/)/.test(file)||
    /[\r\n"'`$<>*?|{}]/.test(file)||file.includes('..')||
    !file.toLowerCase().endsWith(extension)||file.length>512)
    throw Error('HOLD_UNSAFE_WINDOWS_PRIVATE_TLS_PATH');
  const path=file.replaceAll('\\','/');
  if(!path.toLowerCase().includes('/rosevearaihub/commsrelay/tls/'))
    throw Error('HOLD_TLS_FILES_MUST_REMAIN_IN_ORIGINAL_USER_CUSTODY');
  return path;
}

export function renderQl352HoldCaddyfile({certificatePath,privateKeyPath}={}){
  const cert=safeWindowsFilePath(certificatePath,'.crt');
  const key=safeWindowsFilePath(privateKeyPath,'.key');
  if(cert===key)throw Error('HOLD_DISTINCT_CERTIFICATE_AND_PRIVATE_KEY_FILES_REQUIRED');
  // This Caddy service is a separately supervised *transport-only* listener.
  // A real QL-350 bridge must eventually supply authenticated same-origin
  // operator sessions, original DB readback and source signing. No proxy is
  // configured until those independent source-side adapters exist.
  return `{\n\tadmin off\n\tauto_https off\n}\n\n`+
    `https://${ORIGINAL_GATEWAY.dns}:${ORIGINAL_GATEWAY.port} {\n`+
    `\tbind ${ORIGINAL_GATEWAY.tailnetIp}\n`+
    `\ttls "${cert}" "${key}"\n`+
    `\theader Cache-Control "no-store"\n`+
    `\theader X-Content-Type-Options "nosniff"\n`+
    `\theader Referrer-Policy "no-referrer"\n`+
    `\trespond /_ql352/transport "HOLD_NO_AUTHENTICATED_PRIVATE_OPERATOR" 503\n`+
    `\trespond "DENY_UNENROLLED_COMMS_BRIDGE" 403\n`+
    `}\n`;
}

/** Checks the locally stored ORIGINAL certificate and its locally held key.
 * No key bytes, passphrase, PEM, private IP inventory or credential is printed.
 * Checking key possession does not authenticate the third-party issuer.
 */
export function verifyQl352OriginalTlsPair({certificateBytes,privateKeyBytes,now=Date.now()}={}){
  try{
    if(!Buffer.isBuffer(certificateBytes)||!Buffer.isBuffer(privateKeyBytes)||
      !Number.isFinite(now)||certificateBytes.length<100||privateKeyBytes.length<100)
      return held('HOLD_ORIGINAL_PRIVATE_TLS_PAIR_REQUIRED');
    const digest=createHash('sha256').update(certificateBytes).digest('hex');
    if(digest!==ORIGINAL_GATEWAY.originalCertificateFileSha256)
      return held('HOLD_CERTIFICATE_ROTATED_REQUIRES_INDEPENDENT_REPIN');
    const certificate=new X509Certificate(certificateBytes);
    if(certificate.subject.trim()!==`CN=${ORIGINAL_GATEWAY.dns}`||
      !certificate.subjectAltName?.split(',').some(s=>s.trim()===`DNS:${ORIGINAL_GATEWAY.dns}`)||
      !/Let's Encrypt/i.test(certificate.issuer)||
      !(new Date(certificate.validFrom).getTime()<=now&&
        new Date(certificate.validTo).getTime()>now+3_600_000))
      return held('HOLD_ORIGINAL_TLS_SUBJECT_SAN_ISSUER_OR_VALIDITY');
    const key=createPrivateKey(privateKeyBytes);
    const publicDer=createPublicKey(key).export({type:'spki',format:'der'});
    const certDer=certificate.publicKey.export({type:'spki',format:'der'});
    if(!Buffer.from(publicDer).equals(Buffer.from(certDer)))
      return held('HOLD_PRIVATE_KEY_DOES_NOT_MATCH_ORIGINAL_CERTIFICATE');
    return held('ORIGINAL_TLS_PAIR_LOCAL_PROOF_ONLY_ISSUER_REVIEW_HELD',{
      privateKeyMatchesPublicCertificate:true,certificateDigestPinned:true,
      expiresAt:certificate.validTo,originalIssuerIndependentlyAuthenticated:false,
      readyToCreateTransportOnlyGateway:true});
  }catch{return held('HOLD_TLS_PAIR_INVALID_OR_INACCESSIBLE');}
}

export function verifyQl352HoldCaddyfile(content,{certificatePath,privateKeyPath}={}){
  try{
    if(typeof content!=='string'||content!==renderQl352HoldCaddyfile({certificatePath,privateKeyPath}))
      return held('HOLD_GATEWAY_CONFIG_DRIFT_OR_AUTH_BYPASS');
    return held('STAGED_TAILNET_ONLY_DENY_ALL_GATEWAY_CONFIG_VERIFIED',{
      source:'ORIGINAL_WINDOWS_CADDYFILE_BYTES',
      routeCount:0,unauthenticatedCommsRoutes:0,tailnetOnly:true,
      originalLanServiceUnchanged:true});
  }catch{return held('HOLD_GATEWAY_CONFIG_OR_TLS_PATH_INVALID');}
}

export function ql352Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('QL352_OFFLINE_USAGE',{
    commands:['--verify-cert CERT_FILE.crt PRIVATE_KEY_FILE.key',
      '--render-hold CERT_FILE.crt PRIVATE_KEY_FILE.key',
      '--verify-hold CONFIG_CADDYFILE CERT_FILE.crt PRIVATE_KEY_FILE.key'],
    networkRequests:0,databaseMutations:0,privateKeyExported:false});
  if(args.length===3&&args[0]==='--verify-cert'){
    const [,cert,key]=args;
    return verifyQl352OriginalTlsPair({certificateBytes:readFileSync(cert),privateKeyBytes:readFileSync(key)});
  }
  if(args.length===3&&args[0]==='--render-hold'){
    const [,cert,key]=args;
    return renderQl352HoldCaddyfile({certificatePath:cert,privateKeyPath:key});
  }
  if(args.length===4&&args[0]==='--verify-hold'){
    const [,config,cert,key]=args;
    return verifyQl352HoldCaddyfile(readFileSync(config,'utf8'),{
      certificatePath:cert,privateKeyPath:key});
  }
  throw Error('DENY_QL352_UNKNOWN_OR_LIVE_NETWORK_ACTION');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const result=ql352Cli();process.stdout.write(typeof result==='string'?result:JSON.stringify(result)+'\n');}
  catch{process.stderr.write('HOLD_QL352_ORIGINAL_WINDOWS_CERT_OR_CONFIG_REQUIRED\n');process.exitCode=1;}
}
