// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'edifice-k6-commons',
      fileName: 'index',
    },
    rollupOptions: {
        external: [
            "k6",
            "k6/http"
        ]
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true, // Ensures a types entry is added to package.json
      outDir: 'dist', // Directory for type definitions
    }),
  ],
})