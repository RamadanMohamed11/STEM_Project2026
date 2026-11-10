import assert from 'node:assert/strict'
import test from 'node:test'
import { Color, OrthographicCamera, Scene, Vector4, LinearToneMapping } from 'three'
import {
  createParticleRenderTarget,
  particleCanvasColorOutput,
} from '../src/features/simulations/lib/particleRenderTarget.ts'

test('offscreen materials retain the old Canvas ACES/sRGB output instead of changing visual colours', () => {
  const shader = {
    uniforms: {},
    fragmentShader: '#include <tonemapping_fragment>\n#include <colorspace_fragment>',
  }
  particleCanvasColorOutput(shader)
  assert.match(shader.fragmentShader, /#include <tonemapping_pars_fragment>/)
  assert.match(shader.fragmentShader, /ACESFilmicToneMapping\( gl_FragColor.rgb \)/)
  assert.match(shader.fragmentShader, /sRGBTransferOETF\( gl_FragColor \)/)
  assert.deepEqual(shader.uniforms.toneMappingExposure, { value: 1 })
})

function setup() {
  const paint = []
  const context = {
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: () => paint.push('copy'),
    save: () => {},
    restore: () => {},
    clearRect: () => {},
    setTransform: (...args) => paint.push(args),
    drawImage: () => paint.push('paint'),
  }
  const canvas = () => ({
    width: 0,
    height: 0,
    getContext(kind) {
      assert.equal(kind, '2d')
      return context
    },
  })
  const output = canvas()
  const initialTarget = { id: 'previous-target' }
  let active = initialTarget,
    viewport = new Vector4(3, 4, 50, 60),
    scissor = new Vector4(8, 9, 30, 40)
  let testScissor = true,
    color = new Color('red'),
    alpha = 0.4
  const calls = [],
    pending = [],
    targets = new Set()
  let disposals = 0
  const gl = {
    capabilities: { maxSamples: 4 },
    autoClear: false,
    toneMapping: LinearToneMapping,
    toneMappingExposure: 2,
    clippingPlanes: ['lab-plane'],
    localClippingEnabled: true,
    getContext: () => ({ isContextLost: () => false }),
    getRenderTarget: () => active,
    getActiveCubeFace: () => 2,
    getActiveMipmapLevel: () => 1,
    getViewport: (v) => v.copy(viewport),
    getScissor: (v) => v.copy(scissor),
    getScissorTest: () => testScissor,
    getClearColor: (c) => c.copy(color),
    getClearAlpha: () => alpha,
    setRenderTarget(target, face, mip) {
      active = target
      calls.push(['target', target, face, mip])
      if (target?.isWebGLRenderTarget && !targets.has(target)) {
        targets.add(target)
        target.addEventListener('dispose', () => disposals++)
      }
    },
    setViewport: (...args) => {
      viewport = args[0]?.isVector4 ? args[0].clone() : new Vector4(...args)
    },
    setScissor: (value) => {
      scissor = value.clone()
    },
    setScissorTest: (value) => {
      testScissor = value
    },
    setClearColor(value, a = 1) {
      color = value?.isColor ? value.clone() : new Color(value)
      alpha = a
    },
    render(scene, camera) {
      calls.push(['render', scene, camera, gl.toneMappingExposure, gl.clippingPlanes])
    },
    clear: (...flags) => calls.push(['clear', ...flags]),
    readRenderTargetPixelsAsync(target, x, y, w, h, buffer) {
      calls.push(['read', target, w, h, buffer.byteLength])
      return new Promise((resolve, reject) => pending.push({ resolve, reject }))
    },
  }
  const renderer = createParticleRenderTarget(gl, output, canvas)
  const scene = new Scene(),
    camera = new OrthographicCamera()
  camera.position.z = 5
  camera.zoom = 130
  let visible = true
  const frame = (w = 272, h = 272, dpr = 1.5) =>
    renderer.render(scene, camera, w, h, dpr, () => visible)
  const settle = async () => {
    pending.shift().resolve()
    await new Promise((resolve) => setImmediate(resolve))
  }
  return {
    renderer,
    gl,
    output,
    calls,
    paint,
    targets,
    frame,
    settle,
    pending,
    scene,
    camera,
    hide: () => {
      visible = false
    },
    disposals: () => disposals,
    state: () => ({ active, viewport, scissor, testScissor, color, alpha }),
  }
}

test('particle pass uses one render target with its own scene/camera and restores lab renderer settings', async () => {
  const r = setup(),
    before = r.state(),
    planes = r.gl.clippingPlanes
  r.frame()
  const render = r.calls.find(([kind]) => kind === 'render')
  assert.equal(render[1], r.scene)
  assert.equal(render[2], r.camera)
  assert.equal(render[3], 1)
  assert.deepEqual(render[4], [])
  assert.deepEqual(r.state(), before)
  assert.equal(r.gl.autoClear, false)
  assert.equal(r.gl.toneMapping, LinearToneMapping)
  assert.equal(r.gl.toneMappingExposure, 2)
  assert.equal(r.gl.clippingPlanes, planes)
  assert.equal(r.gl.localClippingEnabled, true)
  assert.deepEqual(
    r.calls.find(([kind]) => kind === 'clear'),
    ['clear', true, true, true],
  )
  assert.equal(r.calls.at(-1)[2], 2)
  assert.equal(r.calls.at(-1)[3], 1)
  assert.equal(r.output.width, 408)
  assert.equal(r.output.height, 408)
  assert.equal(r.camera.left, -136)
  assert.equal(r.camera.zoom, 130)
  await r.settle()
  assert.ok(r.paint.includes('paint'))
  assert.deepEqual(r.paint.find(Array.isArray), [1, 0, 0, -1, 0, 408])
  r.renderer.dispose()
})
test('GPU readback is bounded to one in flight and a settled frame allows the next', async () => {
  const r = setup()
  for (let i = 0; i < 60; i++) r.frame()
  assert.equal(r.pending.length, 1)
  assert.equal(r.calls.filter(([kind]) => kind === 'render').length, 1)
  await r.settle()
  r.frame()
  assert.equal(r.pending.length, 1)
  assert.equal(r.targets.size, 1)
  await r.settle()
  r.renderer.dispose()
})
test('closing during asynchronous readback paints nothing and releases the target exactly once', async () => {
  const r = setup()
  r.frame()
  r.renderer.dispose()
  r.renderer.dispose()
  assert.equal(r.disposals(), 0)
  await r.settle()
  assert.equal(r.disposals(), 1)
  assert.deepEqual(r.paint, [])
  r.frame()
  assert.equal(r.pending.length, 0)
})
test('hidden page skips rendering and suppresses a pending bitmap copy', async () => {
  const r = setup()
  r.frame()
  r.hide()
  await r.settle()
  assert.deepEqual(r.paint, [])
  r.frame()
  assert.equal(r.pending.length, 0)
  r.renderer.dispose()
})
test('resizing reuses the framebuffer and updates resolution without changing zoom', async () => {
  const r = setup()
  r.frame()
  await r.settle()
  const target = [...r.targets][0]
  r.frame(240, 240, 1)
  assert.equal([...r.targets][0], target)
  assert.equal(r.output.width, 240)
  assert.equal(r.camera.left, -120)
  assert.equal(r.camera.zoom, 130)
  await r.settle()
  r.renderer.dispose()
})
test('readback failure is handled without an unhandled rejection or stuck pass', async () => {
  const r = setup()
  r.frame()
  r.pending.shift().reject(Error('context lost'))
  await new Promise((resolve) => setImmediate(resolve))
  r.frame()
  assert.equal(r.pending.length, 1)
  await r.settle()
  r.renderer.dispose()
})
test('even a synchronous renderer error restores the framebuffer, viewport and lab state', () => {
  const r = setup(),
    before = r.state()
  r.gl.render = () => {
    throw Error('renderer failed')
  }
  assert.throws(() => r.frame(), /renderer failed/)
  assert.deepEqual(r.state(), before)
  assert.equal(r.gl.toneMapping, LinearToneMapping)
  r.renderer.dispose()
  assert.equal(r.disposals(), 1)
})
