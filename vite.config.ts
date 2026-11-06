import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { validatePublicAuthEnvironment } from './scripts/validate-public-auth-env.ts'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  validatePublicAuthEnvironment({
    ...loadEnv(mode, process.cwd(), 'VITE_'),
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))),
  })
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'three-engine', test: /node_modules[\\/]three[\\/]/, priority: 30 },
              { name: 'react-three', test: /node_modules[\\/]@react-three[\\/]/, priority: 20 },
              { name: 'three-stdlib', test: /node_modules[\\/]three-stdlib[\\/]/, priority: 10 },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
