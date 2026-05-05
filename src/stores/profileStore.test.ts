import { describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore } from './profileStore.ts';

describe('profileStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useProfileStore.setState({ token: null, profile: null });
  });

  it('starts empty', () => {
    expect(useProfileStore.getState().token).toBeNull();
    expect(useProfileStore.getState().profile).toBeNull();
  });

  it('login() sets token + profile and persists token', () => {
    useProfileStore.getState().login('jwt.token.here', {
      id: 'p1', username: 'PizzaDragon', avatar: 'avatar_cat', age_band: '5-6',
    });
    expect(useProfileStore.getState().token).toBe('jwt.token.here');
    expect(localStorage.getItem('kq_token')).toBe('jwt.token.here');
  });

  it('logout() clears state and storage', () => {
    useProfileStore.getState().login('jwt', {
      id: 'p1', username: 'X', avatar: 'avatar_cat', age_band: '5-6',
    });
    useProfileStore.getState().logout();
    expect(useProfileStore.getState().token).toBeNull();
    expect(localStorage.getItem('kq_token')).toBeNull();
  });

  it('rehydrateFromStorage() restores prior session', () => {
    localStorage.setItem('kq_token', 'old-token');
    localStorage.setItem('kq_profile', JSON.stringify({
      id: 'p1', username: 'X', avatar: 'avatar_cat', age_band: '5-6',
    }));
    useProfileStore.getState().rehydrateFromStorage();
    expect(useProfileStore.getState().token).toBe('old-token');
    expect(useProfileStore.getState().profile?.username).toBe('X');
  });
});
