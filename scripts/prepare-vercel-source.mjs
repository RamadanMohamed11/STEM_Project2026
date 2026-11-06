import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
const root = process.cwd()
const payloadPath = join(root, 'artifacts/t10-deployment-payload.json')
const roots = ['src', 'public']
const files = []
function add(path) {
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path)) add(join(path, name))
    return
  }
  const file = relative(root, path).replaceAll('\\', '/')
  files.push({ file, data: readFileSync(path).toString('base64'), encoding: 'base64' })
}
if (process.argv[2] === 'prepare') {
  for (const name of roots) add(join(root, name))
  for (const name of [
    'package.json',
    'package-lock.json',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'vercel.json',
    'scripts/validate-public-auth-env.ts',
  ])
    add(join(root, name))
  mkdirSync(join(root, 'artifacts'), { recursive: true })
  const text = JSON.stringify(files)
  writeFileSync(payloadPath, text)
  console.log(
    JSON.stringify({
      files: files.length,
      characters: text.length,
      excludes: 'No .env, credentials, archives, local tooling state or test fixtures',
    }),
  )
} else {
  const text = readFileSync(payloadPath, 'utf8')
  const offset = Number(process.argv[2])
  process.stdout.write(text.slice(offset, offset + 12000))
}
