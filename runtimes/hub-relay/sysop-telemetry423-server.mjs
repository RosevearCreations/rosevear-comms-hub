import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {startSysopTelemetryServer} from './sysop-telemetry423.mjs';
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv[2]!=='--serve')process.stdout.write('Build423 Comms telemetry OFF. Use --serve only on the private operator host after signer/token enrollment.\n');
 else{try{const port=Number(process.env.ROSEVEAR_SYSOP_TELEMETRY_PORT||8790);await startSysopTelemetryServer({env:process.env},{port});process.stdout.write('Build423 Comms telemetry loopback source listening; read-only and non-authorizing.\n');}catch(error){process.stderr.write('HOLD_SYSOP_TELEMETRY_NOT_STARTED: '+error.message+'\n');process.exitCode=1;}}
}
