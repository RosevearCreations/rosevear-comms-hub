/** QL-340C: validate real, short-lived original-owner approvals before local startup. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyDeviceEnrollment} from './enrollment.mjs';

export function verifyLocalActivation(enrollment, pins, now=Date.now()) {
  if (!pins || pins.schema !== 'rosevear.hub.ql339b.owner-authorities.v1' ||
      !pins.source?.keyId || !pins.master?.keyId ||
      pins.source.keyId === pins.master.keyId) {
    return {state:'HOLD_PRIVATE_ORIGINAL_OWNER_PINS_REQUIRED',approved:false};
  }
  const result=verifyDeviceEnrollment(enrollment,pins,now);
  if (!result.enrolled) return {state:result.state,approved:false};
  if (enrollment.payload.deviceId!=='rosevear-windows-hub'||
      enrollment.payload.workloadId!=='hub-probe'||
      enrollment.payload.keyId!=='hub-ql339b') {
    return {state:'DENY_UNEXPECTED_DEVICE_WORKLOAD_KEY',approved:false};
  }
  return {state:'SIGNED_TEST_ENROLLMENT_VERIFIED_LOCAL_START_REVIEW_REQUIRED',
    approved:true,deviceId:enrollment.payload.deviceId,
    workloadId:enrollment.payload.workloadId,expiresAt:enrollment.payload.expiresAt,
    customerCommunications:false,deviceActions:false,networkRequests:0};
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length!==4) throw Error('HOLD_PRIVATE_ENROLLMENT_AND_PINS_REQUIRED');
    const enrollment=JSON.parse(readFileSync(resolve(process.argv[2]),'utf8'));
    const pins=JSON.parse(readFileSync(resolve(process.argv[3]),'utf8'));
    const result=verifyLocalActivation(enrollment,pins);
    process.stdout.write(JSON.stringify(result)+'\n');
    if (!result.approved) process.exitCode=1;
  } catch(error) {
    process.stderr.write(`HOLD_LOCAL_ACTIVATION_NOT_APPROVED: ${error.message}\n`);
    process.exitCode=1;
  }
}
