import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

// We re-import the module under each test to re-evaluate the env-driven const.

describe('backend selector', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns mockBackend when supabase env vars are unset', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const { backend, backendKind } = await import('./backend.ts');
    const { mockBackend } = await import('./mockBackend.ts');
    expect(backendKind).toBe('mock');
    expect(backend).toBe(mockBackend);
  });

  it('returns supabaseBackend when both env vars are set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon');
    // Mock supabase-js so the import doesn't try to make real network calls.
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn(() => ({ rpc: vi.fn(), from: vi.fn() })),
    }));
    const { backend, backendKind } = await import('./backend.ts');
    const { supabaseBackend } = await import('./supabaseBackend.ts');
    expect(backendKind).toBe('supabase');
    expect(backend).toBe(supabaseBackend);
  });

  it('returns mockBackend when only one env var is set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const { backendKind } = await import('./backend.ts');
    expect(backendKind).toBe('mock');
  });
});
