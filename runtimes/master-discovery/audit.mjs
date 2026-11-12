/** Recurring public immutable GitHub contract discovery; never calls tenant APIs. */
import {SOURCES,discoverSource} from './manifest.mjs';
import {evaluateDiscoveryAudit} from './audit-result.mjs';
const results=[];
for(const [sourceId,{repo}] of Object.entries(SOURCES)){
  let sha=null;
  try{
    const url=`https://api.github.com/repos/RosevearCreations/${repo}/commits/main`;
    const response=await fetch(url,{method:'GET',redirect:'manual',headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(6000)});
    if(response.status!==200||response.url!==url)throw new Error('SOURCE_COMMIT_UNAVAILABLE');
    const body=await response.json();
    if(!/^[0-9a-f]{40}$/.test(body.sha))throw new Error('INVALID_SOURCE_SHA');
    sha=body.sha;
  }catch{results.push({sourceId,status:'SOURCE_COMMIT_UNAVAILABLE_HELD',connected:false});continue;}
  results.push(await discoverSource(sourceId,sha));
}
const verdict=evaluateDiscoveryAudit(results);
const summary={build:'QL-333/424',observedAt:new Date().toISOString(),
  ...verdict,
  mode:'PUBLIC_GITHUB_IMMUTABLE_GET_ONLY',sourceCount:results.length,
  authenticallyConnected:0,sourcePrivateGets:0,externalWrites:0,results};
process.stdout.write(JSON.stringify(summary,null,2)+'\n');
if(verdict.ci==='FAIL')process.exitCode=1;
if(verdict.operational==='HOLD')process.stderr.write('::warning::Six-source public discovery is operational HOLD; no source is CONNECTED. '+verdict.reason+'\n');
