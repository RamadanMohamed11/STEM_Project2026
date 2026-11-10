import {
  ACESFilmicToneMapping,
  Color,
  Vector4,
  WebGLRenderTarget,
  type OrthographicCamera,
  type MeshBasicMaterial,
  type Scene,
  type WebGLRenderer,
} from 'three'

/** Match the old Canvas's ACES → sRGB output before blending, even into an offscreen RGBA8 target. */
export function particleCanvasColorOutput(
  shader: Parameters<MeshBasicMaterial['onBeforeCompile']>[0],
) {
  shader.uniforms.toneMappingExposure = { value: 1 }
  shader.fragmentShader =
    '#include <tonemapping_pars_fragment>\n' +
    shader.fragmentShader
      .replace(
        '#include <tonemapping_fragment>',
        'gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );',
      )
      .replace('#include <colorspace_fragment>', 'gl_FragColor = sRGBTransferOETF( gl_FragColor );')
}

/**
 * Option b: the lab renderer draws an isolated scene into an owned framebuffer.
 * A 2D bitmap keeps normal DOM clipping/stacking without another WebGL context.
 * One asynchronous readback at a time avoids blocking the lab on GPU readPixels.
 */
export function createParticleRenderTarget(
  gl: WebGLRenderer,
  canvas: HTMLCanvasElement,
  makeCanvas = () => document.createElement('canvas'),
) {
  const output = canvas.getContext('2d')
  const staging = makeCanvas()
  const copy = staging.getContext('2d')
  if (!output || !copy) return null
  const target = new WebGLRenderTarget(1, 1, {
    // Raw display-encoded bytes; the materials apply the original Canvas output transform.
    // An sRGB framebuffer would blend in linear space and change the existing particle colours.
    samples: Math.min(4, gl.capabilities.maxSamples),
    stencilBuffer: false,
  })
  let disposed = false
  let released = false
  let busy = false
  let cssWidth = 0,
    cssHeight = 0
  let image: ImageData | null = null
  const viewport = new Vector4(),
    scissor = new Vector4(),
    clearColor = new Color()
  const release = () => {
    if (!released) {
      released = true
      target.dispose()
    }
  }

  return {
    render(
      scene: Scene,
      camera: OrthographicCamera,
      width: number,
      height: number,
      dpr: number,
      visible: () => boolean,
    ) {
      if (
        disposed ||
        busy ||
        !visible() ||
        width <= 0 ||
        height <= 0 ||
        gl.getContext().isContextLost()
      )
        return
      const pixelWidth = Math.max(1, Math.round(width * dpr))
      const pixelHeight = Math.max(1, Math.round(height * dpr))
      if (!image || target.width !== pixelWidth || target.height !== pixelHeight) {
        target.setSize(pixelWidth, pixelHeight)
        canvas.width = staging.width = pixelWidth
        canvas.height = staging.height = pixelHeight
        image = copy.createImageData(pixelWidth, pixelHeight)
      }
      if (width !== cssWidth || height !== cssHeight) {
        cssWidth = width
        cssHeight = height
        camera.left = -width / 2
        camera.right = width / 2
        camera.top = height / 2
        camera.bottom = -height / 2
        camera.updateProjectionMatrix()
      }
      const previousTarget = gl.getRenderTarget()
      const face = gl.getActiveCubeFace(),
        mip = gl.getActiveMipmapLevel()
      gl.getViewport(viewport)
      gl.getScissor(scissor)
      gl.getClearColor(clearColor)
      const scissorTest = gl.getScissorTest(),
        alpha = gl.getClearAlpha(),
        autoClear = gl.autoClear
      const toneMapping = gl.toneMapping,
        exposure = gl.toneMappingExposure
      const clippingPlanes = gl.clippingPlanes,
        localClipping = gl.localClippingEnabled
      let pending: Promise<unknown> | undefined
      try {
        gl.setRenderTarget(target)
        gl.setViewport(0, 0, pixelWidth, pixelHeight)
        gl.setScissorTest(false)
        gl.setClearColor(0, 0)
        // Clear explicitly: a lab post-process may have disabled individual auto-clear flags.
        gl.autoClear = false
        gl.clear(true, true, true)
        // Match the old standalone R3F Canvas, independently of lab effects/post-processing.
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        gl.clippingPlanes = []
        gl.localClippingEnabled = false
        gl.render(scene, camera)
        busy = true
        const frame = image
        pending = gl.readRenderTargetPixelsAsync(
          target,
          0,
          0,
          pixelWidth,
          pixelHeight,
          new Uint8Array(frame.data.buffer),
        )
        void pending
          .then(() => {
            if (disposed || !visible()) return
            copy.putImageData(frame, 0, 0)
            // WebGL's origin is bottom-left; DOM canvas has a top-left origin.
            output.save()
            output.setTransform(1, 0, 0, -1, 0, pixelHeight)
            output.clearRect(0, 0, pixelWidth, pixelHeight)
            output.drawImage(staging, 0, 0)
            output.restore()
          })
          .catch(() => {
            // Context loss is handled by LaboratoryScene's existing recovery UI.
          })
          .finally(() => {
            busy = false
            if (disposed) release()
          })
      } finally {
        // Never leak framebuffer/viewport/colour settings into the following lab render.
        gl.setRenderTarget(previousTarget, face, mip)
        gl.setViewport(viewport)
        gl.setScissor(scissor)
        gl.setScissorTest(scissorTest)
        gl.setClearColor(clearColor, alpha)
        gl.autoClear = autoClear
        gl.toneMapping = toneMapping
        gl.toneMappingExposure = exposure
        gl.clippingPlanes = clippingPlanes
        gl.localClippingEnabled = localClipping
        if (!pending) busy = false
      }
    },
    dispose() {
      disposed = true
      // Do not delete a framebuffer while its asynchronous readback is still in flight.
      if (!busy) release()
    },
  }
}
