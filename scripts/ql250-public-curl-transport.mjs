/**
 * Public GitHub transport for operator machines where Node fetch cannot use the
 * configured network proxy. Explicit opt-in only; no shell or request secrets.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ql249PermittedPublicUrl } from './ql249-public-github-origin-retest.mjs';

const run = promisify(execFile);
const MARKER = '\n__QL250_HTTP_STATUS__';
export async function ql250CurlPublic(url, runImpl = run) {
  if (!ql249PermittedPublicUrl(url)) throw new Error('DENIED_PUBLIC_GITHUB_URL');
  // GitHub /commits/main can include a very large diff. The exact equivalent
  // branch-ref endpoint is small, immutable at request time, and exposes SHA.
  const isMain = url.endsWith('/commits/main');
  const isCommit = /\/commits\/[0-9a-f]{40}$/.test(url);
  const actualUrl = isMain ? url.replace(/\/commits\/main$/, '/git/ref/heads/main')
    : isCommit ? url.replace(/\/commits\//, '/git/commits/') : url;
  const args = ['-q', '--silent', '--show-error', '--max-time', '8', '--max-filesize', '65536',
    '--max-redirs', '0', '--proto', '=https', '--request', 'GET',
    '--header', 'Accept: application/json', '--user-agent', 'rosevear-comms-hub-ql250-public-source',
    '--write-out', `${MARKER}%{http_code}`, actualUrl];
  // execFile executes curl directly with no shell; -q disables .curlrc overrides.
  const result = await runImpl('curl', args,
    { encoding: 'utf8', maxBuffer: 68_000, timeout: 10_000, shell: false });
  const output = result?.stdout;
  if (typeof output !== 'string' || Buffer.byteLength(output, 'utf8') > 68_000)
    throw new Error('DENIED_RESPONSE_BYTES');
  const marker = output.lastIndexOf(MARKER);
  if (marker < 0) throw new Error('DENIED_HTTP_STATUS_MARKER');
  const code = output.slice(marker + MARKER.length), body = output.slice(0, marker);
  if (code === '404') return { status: 404, body: null };
  if (code !== '200' || Buffer.byteLength(body, 'utf8') > 65_536)
    throw new Error('DENIED_HTTP_STATUS_OR_SIZE');
  if (isMain) {
    let parsed;
    try { parsed = JSON.parse(body); } catch { throw new Error('DENIED_GITHUB_REF_JSON'); }
    if (parsed?.ref !== 'refs/heads/main' ||
      !/^[0-9a-f]{40}$/.test(parsed?.object?.sha || ''))
      throw new Error('DENIED_GITHUB_REF_SCOPE');
    return { status: 200, body: JSON.stringify({ sha: parsed.object.sha }) };
  }
  if (isCommit) {
    let parsed;
    try { parsed = JSON.parse(body); } catch { throw new Error('DENIED_GITHUB_COMMIT_JSON'); }
    if (!/^[0-9a-f]{40}$/.test(parsed?.sha || '') ||
      !actualUrl.endsWith(`/git/commits/${parsed.sha}`))
      throw new Error('DENIED_GITHUB_COMMIT_SCOPE');
    return { status: 200, body: JSON.stringify({ sha: parsed.sha }) };
  }
  return { status: 200, body };
}
