#!/usr/bin/env python3
"""Verify the public, disabled Comms Hub Worker matches the exact local JS/CSS build."""
import hashlib
import os
import re
import sys
import time
import urllib.request
from pathlib import Path


ORIGIN = 'https://rosevear-comms-hub.devilndovelive.workers.dev'
DIST = Path('app/dist')


def assets(html):
    return sorted(set(re.findall(r'/assets/index-[A-Za-z0-9_-]+\.(?:js|css)', html)))


def download(path):
    req = urllib.request.Request(ORIGIN + path, headers={
        'User-Agent': 'Rosevear-Comms-Hub-Public-Release-Verification/1',
    })
    with urllib.request.urlopen(req, timeout=15) as response:
        if response.status != 200:
            raise ValueError('Public asset returned non-200')
        return response.read()


def verify():
    expected = assets((DIST / 'index.html').read_text(encoding='utf-8'))
    if (len(expected) != 2 or not any(s.endswith('.js') for s in expected)
            or not any(s.endswith('.css') for s in expected)):
        sys.exit('UNVERIFIED: expected exactly one JS and one CSS index asset in local build')

    hashes = {item: hashlib.sha256((DIST / item.lstrip('/')).read_bytes()).hexdigest()
              for item in expected}
    for attempt in range(1, 16):
        try:
            remote_html = download('/').decode('utf-8')
            if assets(remote_html) != expected:
                raise ValueError('Worker HTML asset references do not match local build')
            for item in expected:
                if hashlib.sha256(download(item)).hexdigest() != hashes[item]:
                    raise ValueError('SHA-256 mismatch for public asset: ' + item)
            print('PUBLIC_WORKER_ASSET_PARITY=GREEN')
            print('SOURCE_SHA=' + os.environ.get('GITHUB_SHA', 'unknown'))
            print('WORKER_ORIGIN=' + ORIGIN)
            for item in expected:
                print(item + ' SHA256=' + hashes[item])
            print('NETWORK_SCOPE=PUBLIC_WORKER_STATIC_HTML_JS_CSS_ONLY')
            print('PROVIDER_CONNECTIONS=0 SOURCE_WRITES=0 SECRET_READS=0 ACK_SENT=0')
            return
        except Exception as exc:
            print(f'Attempt {attempt}/15: {exc}', flush=True)
            if attempt < 15:
                time.sleep(15)
    sys.exit('UNVERIFIED: public worker assets did not match tested build')


if __name__ == '__main__':
    verify()
