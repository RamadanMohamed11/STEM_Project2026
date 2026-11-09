import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buttonVariantStyles } from '../src/components/ui/buttonStyles.ts'

test('shared primary and outline button text meets normal-text contrast on its surface', () => {
  const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')
  const color = (name) =>
    name === 'white' ? '#ffffff' : tokens.match(new RegExp(`--color-${name}: (#[a-f0-9]{6})`))[1]
  const luminance = (hex) =>
    hex
      .slice(1)
      .match(/../g)
      .map((c) => parseInt(c, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
  const contrast = (a, b) =>
    (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)
  const primary = buttonVariantStyles.primary
  const outline = buttonVariantStyles.outline
  assert.ok(
    contrast(color(primary.match(/^bg-([\w-]+)/)[1]), color(primary.match(/ text-([\w-]+)/)[1])) >=
      4.5,
  )
  for (const surface of ['white', 'canvas', 'teal-soft']) {
    assert.ok(contrast(color(outline.match(/ text-([\w-]+)/)[1]), color(surface)) >= 4.5)
  }
})

test('I17 semantic foreground tokens meet AA on their intended light surfaces', () => {
  const text = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')
  const colors = Object.fromEntries(
    Array.from(text.matchAll(/--color-([\w-]+): (#[a-f0-9]{6})/g), (m) => [m[1], m[2]]),
  )
  const lum = (hex) =>
    hex
      .slice(1)
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
  for (const name of ['navy', 'ink', 'slate', 'teal', 'teal-dark', 'success', 'danger', 'info']) {
    for (const surface of ['#ffffff', colors.canvas, colors['teal-soft']]) {
      assert.ok(ratio(colors[name], surface) >= 4.5, `${name} on ${surface}`)
    }
  }
  assert.ok(ratio(colors['warning-dark'], colors['warning-soft']) >= 4.5)
  assert.ok(ratio('#74838d', '#ffffff') >= 3, 'form field boundary')
})
