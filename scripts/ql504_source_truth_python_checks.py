#!/usr/bin/env python3
"""QL504 offline cross-language acceptance: no credentials or outbound sends."""
import json
from pathlib import Path
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / 'runtimes/master-discovery/ql504-private-receipt-worker.mjs'
CLI = ROOT / 'runtimes/master-discovery/ql504-original-host-cli.mjs'
UI = ROOT / 'app/src/operator/Ql503DurableDeliveryHistory.tsx'

class QL504Safety(unittest.TestCase):
    def node(self,*args):
        return subprocess.run(['node',str(CLI),*args],
            cwd=ROOT,text=True,capture_output=True,timeout=15)
    def test_offline_status_in_any_ci_does_not_start_receiver_or_send(self):
        x=self.node('--status')
        self.assertEqual(x.returncode,0,x.stderr)
        data=json.loads(x.stdout)
        self.assertFalse(data['networkListening'])
        self.assertFalse(data['receiverStarted'])
        self.assertFalse(data['customerMessageSent'])
        self.assertFalse(data['originalRuntimeVerified'])
    def test_private_draining_not_exposed_via_public_cli(self):
        x=self.node('--drain-once')
        self.assertNotEqual(x.returncode,0)
        self.assertEqual(json.loads(x.stdout)['state'],'HOLD')
        self.assertIn('NOT_AUTHORIZED',json.loads(x.stdout)['reason'])
    def test_host_inspection_rejects_ci(self):
        x=self.node('--inspect')
        self.assertNotEqual(x.returncode,0)
        self.assertIn('ORIGINAL_REE_WINDOWS_HOST_REQUIRED',x.stdout)
    def test_private_worker_has_custody_and_no_network_or_provider_sender(self):
        code=WORKER.read_text(encoding='utf-8')
        self.assertIn('fsyncSync',code)
        self.assertIn("openSync(lockPath,'wx'",code)
        self.assertIn('DEAD_LETTER',code)
        self.assertIn('persistQl503VerifiedImport',code)
        for pattern in (
            r'\bfetch\s*\(',r'\bcreateServer\s*\(',r'\blisten\s*\(',
            r'\bsendMail\s*\(',r'\bsendSMS\s*\(',
            r'createPrivateKey\s*\(',r'generateKeyPair\s*\('):
            self.assertIsNone(re.search(pattern,code),pattern)
    def test_ui_refresh_is_automatic_and_no_browser_writer(self):
        code=UI.read_text(encoding='utf-8')
        self.assertIn('setInterval',code)
        self.assertIn('onAuthStateChange',code)
        self.assertIn('visibilitychange',code)
        self.assertNotIn('.insert(',code)
        self.assertNotIn('.rpc(',code)
        self.assertIn('data-ql503-public-sends="false"',code)

if __name__=='__main__':
    unittest.main(verbosity=2)
