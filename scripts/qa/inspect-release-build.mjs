import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const html = readFileSync('dist/index.html', 'utf8')
assert.doesNotMatch(html, /modulepreload[^>]+(?:three-engine|react-three|LaboratoryScene)/)
const entry = html.match(/src="([^\"]+\.js)"/)[1]
const source = readFileSync(join('dist', entry))
assert.ok(
  gzipSync(source).length < 400_000,
  'Initial compressed JS exceeds the reviewed 400 kB budget.',
)
let scanned = 0
function scan(directory) {
  for (const name of readdirSync(directory)) {
    const file = join(directory, name)
    if (statSync(file).isDirectory()) {
      scan(file)
      continue
    }
    if (!/\.(js|json|html|css|map)$/.test(file)) continue
    const text = readFileSync(file, 'utf8')
    assert.doesNotMatch(
      text,
      /sb_secret_[A-Za-z0-9_-]{15,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
      `Secret-like value in ${file}`,
    )
    for (const token of text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []) {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
      assert.notEqual(payload.role, 'service_role', `Service credential in ${file}`)
    }
    scanned++
  }
}
scan('dist')
console.log(
  JSON.stringify({
    passed: true,
    initialJavaScriptGzipBytes: gzipSync(source).length,
    scannedFiles: scanned,
    threePreloaded: false,
  }),
)
