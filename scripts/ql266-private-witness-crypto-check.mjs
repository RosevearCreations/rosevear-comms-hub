/**
 * QL-266: optional offline Ed25519 possession signature check.
 * Verifies cryptography only — never authenticates human custodian/witness/reviewer
 * or authorizes a network TEST. The trusted SPKI pin MUST arrive separately.
 */
import {createHash,createPublicKey,verify,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const SOURCE_IDS=new Set([
  'ai-data-platform','devilndove','rosiedazzlers','yw','icamp','rosevear-ai-hub'
]);
const FIELDS=['schema','source','sourceCommitSha','issuedAt','nonceBase64url',
  'publicSpkiDerBase64','signatureBase64url'];
const SCHEMA='rosevear-comms-ql266-witness-crypto/v1';

function strictBase64(value,alphabet,maxBytes){
  if(typeof value!=='string'||value.length===0||value.length>maxBytes*2)
    throw new Error('INVALID_BASE64_LENGTH');
  const expression=alphabet==='base64url'?/^[A-Za-z0-9_-]+$/:/^[A-Za-z0-9+/]+={0,2}$/;
  if(!expression.test(value))throw new Error('INVALID_BASE64_ALPHABET');
  const buf=Buffer.from(value,alphabet);
  if(!buf.length||buf.length>maxBytes)throw new Error('INVALID_BINARY_LENGTH');
  const normalized=alphabet==='base64url'?buf.toString('base64url')
    :buf.toString('base64').replace(/=+$/,'');
  if(normalized!==value.replace(/=+$/,''))throw new Error('INVALID_BINARY_CANONICAL');
  return buf;
}

export function verifyQl266WitnessCryptography(receipt,trustedPinHex,nowMs=Date.now()){
  const held={schema:SCHEMA,cryptographicPossession:'NOT_VERIFIED',
    publicPin:'NOT_VERIFIED',challengeFreshness:'NOT_VERIFIED',
    independentlyAuthenticatedHumanRoles:'NOT_VERIFIED',
    originalSignedSourceProofB:'NOT_AVAILABLE',
    authenticatedGatewayGets:0,ownerTestAuthorization:'NOT_GIVEN',
    conditionalTestSlot:'HELD_UNSCHEDULED',integration:'DISCONNECTED / HOLD'};
  try{
    if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)||
      Object.keys(receipt).sort().join('|')!==[...FIELDS].sort().join('|')||
      receipt.schema!==SCHEMA||!SOURCE_IDS.has(receipt.source)||
      !/^[0-9a-f]{40}$/.test(receipt.sourceCommitSha)||
      !/^[0-9a-f]{64}$/.test(trustedPinHex??''))return {...held,reason:'INVALID_OR_UNTRUSTED_INPUT'};

    const parsed=Date.parse(receipt.issuedAt);
    if(!Number.isFinite(parsed)||new Date(parsed).toISOString()!==receipt.issuedAt||
      !Number.isFinite(nowMs)||parsed>nowMs+30_000||nowMs-parsed>300_000)
      return {...held,reason:'CHALLENGE_OUTSIDE_FIVE_MINUTE_WINDOW'};

    const nonce=strictBase64(receipt.nonceBase64url,'base64url',96);
    if(nonce.length<16)return {...held,reason:'NONCE_TOO_SHORT'};
    const spki=strictBase64(receipt.publicSpkiDerBase64,'base64',512);
    const signature=strictBase64(receipt.signatureBase64url,'base64url',128);
    const publicKey=createPublicKey({key:spki,format:'der',type:'spki'});
    if(publicKey.asymmetricKeyType!=='ed25519'||signature.length!==64)
      return {...held,reason:'UNSUPPORTED_PUBLIC_KEY_OR_SIGNATURE'};
    const digest=createHash('sha256').update(spki).digest();
    const trusted=Buffer.from(trustedPinHex,'hex');
    if(!timingSafeEqual(digest,trusted))return {...held,reason:'INDEPENDENT_PIN_MISMATCH'};

    const message=[SCHEMA,receipt.source,receipt.sourceCommitSha,
      receipt.issuedAt,receipt.nonceBase64url].join('\n');
    if(!verify(null,Buffer.from(message,'utf8'),publicKey,signature))
      return {...held,publicPin:'PIN_MATCHED',challengeFreshness:'WITHIN_FIVE_MINUTES',reason:'SIGNATURE_INVALID'};

    return {...held,publicPin:'PIN_MATCHED',challengeFreshness:'WITHIN_FIVE_MINUTES',
      cryptographicPossession:'SIGNATURE_VALID_ONLY',
      reason:'HUMAN_CUSTODY_AND_ORIGINAL_PROOF_STILL_REQUIRE_PRIVATE_REVIEW'};
  }catch{
    return {...held,reason:'MALFORMED_CRYPTOGRAPHIC_RECEIPT'};
  }
}

if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href){
  const receiptPath=process.argv[2];
  if(!receiptPath||!process.env.QL266_TRUSTED_SPKI_SHA256){
    process.stderr.write('Provide one private receipt file path and separately sourced QL266_TRUSTED_SPKI_SHA256. No secret material is printed.\n');
    process.exitCode=2;
  }else{
    try{
      const raw=await readFile(receiptPath,'utf8');
      if(raw.length>32_768)throw new Error('too large');
      const result=verifyQl266WitnessCryptography(JSON.parse(raw),process.env.QL266_TRUSTED_SPKI_SHA256);
      process.stdout.write(JSON.stringify(result,null,2)+'\n');
      if(result.cryptographicPossession!=='SIGNATURE_VALID_ONLY')process.exitCode=1;
    }catch{
      process.stderr.write('Private witness receipt could not be verified. No receipt contents or paths were printed.\n');
      process.exitCode=1;
    }
  }
}
