#!/usr/bin/env node
/** Never contacts private app gateways, mini-server, or secrets. */
import { inspectQl249GithubOrigins } from './ql249-public-github-origin-retest.mjs';
import { ql250CurlPublic } from './ql250-public-curl-transport.mjs';
import { inspectQl255SixAppResponseDispositions }
  from './ql255-response-disposition-owner-relay.mjs';
const args=process.argv.slice(2);
if(args.length>1 || args.length===1 && args[0]!=='--public-get'){
  process.stderr.write('Usage: node scripts/ql255-public-disposition.mjs [--public-get]\n');
  process.exitCode=2;
}else{
  const origin=await inspectQl249GithubOrigins({getPublic:args.length?ql250CurlPublic:undefined});
  const disposition=inspectQl255SixAppResponseDispositions(origin.rows);
  process.stdout.write(JSON.stringify({publicGithubOnly:args.length===1,
    observedAtUtc:args.length?new Date().toISOString():null,...disposition},null,2)+'\n');
}
