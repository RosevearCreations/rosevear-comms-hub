/** QL-339B: loopback-only private HTTP receiver. Public Cloudflare assets unchanged. */
import {createServer} from 'node:http';
import {privateHubHeartbeatLedger} from './heartbeat.mjs';

const PATH='/private/ql339b/hub/heartbeat';
const MAX_BYTES=4096;
const isLoopback=address=>address==='127.0.0.1'||address==='::1'||
  address==='::ffff:127.0.0.1';
const response=(state)=>({schema:'rosevear.hub.ql339b.receiver.v1',state,
  privateConnection:'DISCONNECTED / HOLD',liveCommunications:0,deviceActions:0});

/** All grants are resolved on the server and both source/master approvals are signed.
 * The HTTP request's alleged trust booleans or enrollment are never consulted. */
export function createPrivateHubHandler({resolveTrust,transaction,now=()=>Date.now()}={}){
  if(typeof resolveTrust!=='function'||typeof transaction!=='function')
    throw new Error('PRIVATE_TRUST_AND_TRANSACTION_REQUIRED');
  const ledger=privateHubHeartbeatLedger(transaction);
  return async(req,res)=>{
    const send=(code,state)=>{res.writeHead(code,{'Content-Type':'application/json',
      'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.end(JSON.stringify(response(state)));};
    if(!isLoopback(req.socket?.remoteAddress))return send(403,'DENY_NONPRIVATE_ORIGIN');
    if(req.method!=='POST'||req.url!==PATH)return send(404,'DENY_UNREGISTERED_ROUTE');
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']??''))
      return send(415,'DENY_MEDIA_TYPE');
    if(Number(req.headers['content-length']??0)>MAX_BYTES)return send(413,'DENY_OVERSIZE');
    const pieces=[];let length=0;
    try{
      for await(const part of req){length+=part.length;
        if(length>MAX_BYTES)return send(413,'DENY_OVERSIZE');pieces.push(part);}
      let packet;
      try{packet=JSON.parse(Buffer.concat(pieces).toString('utf8'));}
      catch{return send(400,'DENY_MALFORMED_JSON');}
      if(!packet||typeof packet!=='object'||Array.isArray(packet)||
        !packet.envelope||typeof packet.envelope!=='object'||
        typeof packet.envelope.deviceId!=='string'||
        typeof packet.envelope.workloadId!=='string')return send(400,'DENY_ENVELOPE');
      const trust=await resolveTrust(packet.envelope.deviceId,packet.envelope.workloadId,
        packet.keyId);
      if(!trust)return send(403,'HOLD_DEVICE_NOT_ENROLLED');
      const saved=await ledger.receive(packet,trust,now());
      if(saved.state==='SAVED_ONE_HELD_DEVICE_RECEIPT')return send(202,saved.state);
      if(saved.state==='DUPLICATE_OR_REPLAY_NO_EFFECT')return send(409,saved.state);
      return send(403,saved.state);
    }catch{return send(503,'HOLD_PRIVATE_RECEIVER_FAILURE');}
  };
}

/** A real host must run this separately on a private/TLS sidecar. No public bind. */
export async function startLoopbackReceiver(options,{port=0}={}){
  if(!Number.isInteger(port)||port<0||port>65535)throw new Error('INVALID_PRIVATE_PORT');
  const server=createServer(createPrivateHubHandler(options));
  server.requestTimeout=5_000;server.headersTimeout=5_000;server.maxRequestsPerSocket=50;
  await new Promise((resolve,reject)=>{
    server.once('error',reject);server.listen(port,'127.0.0.1',resolve);
  });
  return server;
}
