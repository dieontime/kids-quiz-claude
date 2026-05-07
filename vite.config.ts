/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: false,
    // Force-clear Supabase env in tests so backend selector defaults to
    // mockBackend. A developer's .env.local with placeholder Supabase
    // values would otherwise route every test through the supabase adapter.
    // Tests that exercise supabaseBackend stub these env vars explicitly.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
})
