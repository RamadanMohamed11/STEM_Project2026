import { createServer as createViteServer } from 'vite'

// SSR route tests don't need concurrent browser dependency scanning/prebundling.
export function createServer(options) {
  return createViteServer({
    ...options,
    optimizeDeps: { ...options?.optimizeDeps, noDiscovery: true, include: [] },
  })
}
