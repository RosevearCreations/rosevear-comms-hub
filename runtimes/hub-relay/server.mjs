/** Explicitly launched QL-339B private receiver. Never part of Cloudflare's public asset Worker. */
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {startLoopbackReceiver} from './private-receiver.mjs';
import {postgresDeviceTrustResolver} from './enrollment.mjs';

function readAuthorityPins(path){
  if(!path||!resolve(path).endsWith('.json'))throw new Error('PRIVATE_PIN_CONFIG_REQUIRED');
  const file=JSON.parse(readFileSync(resolve(path),'utf8'));
  const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
    Object.keys(value).length===keys.length&&Object.keys(value).every(k=>keys.includes(k));
  if(file.schema!=='rosevear.hub.ql339b.owner-authorities.v1'||
    !exact(file.source,['keyId','publicKeyPem'])||
    !exact(file.master,['keyId','publicKeyPem'])||
    !file.source?.keyId||!file.master?.keyId||
    !file.source?.publicKeyPem||!file.master?.publicKeyPem||
    Object.keys(file).some(key=>!['schema','source','master'].includes(key)))
    throw new Error('PRIVATE_PIN_SCHEMA_INVALID');
  if(process.platform!=='win32'&&(statSync(resolve(path)).mode&0o022)!==0)
    throw new Error('OWNER_PIN_FILE_WRITABLE_BY_OTHERS');
  return {source:file.source,master:file.master};
}

export async function startConfiguredPrivateReceiver({connectionString,authorityConfigPath,
  poolFactory,port=8788}={}){
  if(!connectionString||!/^postgres(?:ql)?:\/\//.test(connectionString)||
    !authorityConfigPath)throw new Error('PRIVATE_HOST_POSTGRES_AND_OWNER_PINS_REQUIRED');
  const authorities=readAuthorityPins(authorityConfigPath);
  const makePool=poolFactory??(async()=>{
    const {Pool}=await import('pg');return new Pool({connectionString,
      ssl:{rejectUnauthorized:true},max:3,connectionTimeoutMillis:5000});
  });
  const pool=await makePool();
  const query=pool.query.bind(pool);
  const transaction=async fn=>{
    const client=await pool.connect();
    try{await client.query('BEGIN');const result=await fn(client);
      await client.query('COMMIT');return result;
    }catch(e){await client.query('ROLLBACK');throw e;}
    finally{client.release();}
  };
  try{
    // Fail closed before opening a TCP listener. A syntactically plausible DSN is
    // not proof that PostgreSQL accepted the dedicated least-privilege identity.
    const identity=await query('SELECT current_user AS receiver_role');
    if(identity.rows?.[0]?.receiver_role!=='ql340c_private_receiver')
      throw Error('PRIVATE_RECEIVER_DATABASE_ROLE_NOT_VERIFIED');
    const server=await startLoopbackReceiver({
      resolveTrust:postgresDeviceTrustResolver(query,authorities),transaction}, {port});
    server.once('close',()=>pool.end());
    return server;
  }catch(error){await pool.end();throw error;}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv[2]!=='--serve'){
    process.stdout.write('QL-339B receiver OFF. Use --serve /path/to/private-authority-pins.json only on a privately controlled host.\n');
  }else{
    try{
      await startConfiguredPrivateReceiver({connectionString:process.env.DATABASE_URL,
        authorityConfigPath:process.argv[3]});
      process.stdout.write('QL-339B loopback-only TEST receiver listening; no device automatically enrolled or connected.\n');
    }catch(error){process.stderr.write(`HOLD_PRIVATE_RECEIVER_NOT_STARTED: ${error.message}\n`);
      process.exitCode=1;}
  }
}
