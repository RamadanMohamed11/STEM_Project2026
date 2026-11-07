import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'

const origin = 'https://stem-project2026.vercel.app'
const checks = []
for (const path of [
  '/',
  '/curriculum',
  '/experiments/exp-salt-water-001/lab',
  '/auth/callback',
  '/reset-password',
]) {
  const response = await fetch(origin + path)
  assert.equal(response.status, 200, `${path} did not return the SPA`)
  assert.match(response.headers.get('content-type'), /text\/html/)
  const html = await response.text()
  assert.match(html, /id="root"/)
  assert.doesNotMatch(html, /modulepreload[^>]+(?:three-engine|react-three|LaboratoryScene)/)
  if (path === '/auth/callback' || path === '/reset-password') {
    assert.match(response.headers.get('cache-control'), /no-store/)
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  }
  checks.push({ path, status: response.status, spa: true })
  if (path === '/') {
    const entry = html.match(/src="([^\"]+\.js)"/)[1]
    const asset = await fetch(new URL(entry, origin))
    assert.equal(asset.status, 200)
    assert.match(asset.headers.get('content-type'), /javascript/)
    const bytes = Buffer.from(await asset.arrayBuffer())
    assert.ok(bytes.toString().includes('Dissolving salt is a physical change'))
    checks.push({
      asset: entry,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      updatedContent: true,
    })
  }
}
mkdirSync('artifacts', { recursive: true })
const report = { origin, checkedAt: new Date().toISOString(), passed: true, checks }
writeFileSync('artifacts/t35-production-http.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report))
