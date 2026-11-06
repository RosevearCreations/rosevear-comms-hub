/** Inert QL-342A drill target: NO receiver code, keys, DB, customers or devices. */
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';

const token=process.env.QL342A_DRILL_TOKEN;
if(process.argv.slice(2).join(' ')!=='--inert-loopback-child'||
  typeof token!=='string'||!/^[a-f0-9]{48}$/.test(token)||
  process.env.DATABASE_URL){
  process.stderr.write('DENY_NON_INERT_DRILL_CHILD\n');
  process.exitCode=1;
}else{
  const digest=createHash('sha256').update(token).digest('hex');
  const server=createServer(socket=>{
    socket.setTimeout(2000,()=>socket.destroy());
    socket.end(`QL342A_INERT_LOOPBACK_ONLY:${digest}\n`);
  });
  server.on('error',()=>{process.stderr.write('HOLD_INERT_LOOPBACK_BIND_FAILED\n');process.exitCode=1;});
  server.listen(0,'127.0.0.1',()=>{
    const address=server.address();
    process.stdout.write(JSON.stringify({schema:'rosevear.hub.ql342a.inert-child.v1',
      pid:process.pid,address:address.address,port:address.port,tokenDigest:digest})+'\n');
  });
  const shutdown=()=>server.close(()=>process.exit(0));
  process.once('SIGTERM',shutdown);
  process.once('SIGINT',shutdown);
}
