import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['scripts/**/*.test.ts', 'src/engine/**/*.test.ts', 'src/data/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/engine/**', 'src/data/**/*.test.ts'],
          setupFiles: ['./src/test/setup.ts'],
          // Lets theme.test.ts read the real tokens via `index.css?raw`.
          css: { include: [/src\/theme\/index\.css/] },
        },
      },
    ],
  },
})
