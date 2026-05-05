import { create } from 'zustand';
import type { Profile } from '../services/mockBackend.ts';

export type { Profile };

interface State {
  token: string | null;
  profile: Profile | null;
  login: (token: string, profile: Profile) => void;
  logout: () => void;
  rehydrateFromStorage: () => void;
}

const STORAGE_KEY = 'kq_token';
const PROFILE_KEY = 'kq_profile';

export const useProfileStore = create<State>((set) => ({
  token: null,
  profile: null,
  login: (token, profile) => {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    set({ token, profile });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROFILE_KEY);
    set({ token: null, profile: null });
  },
  rehydrateFromStorage: () => {
    const token = localStorage.getItem(STORAGE_KEY);
    const profileRaw = localStorage.getItem(PROFILE_KEY);
    if (token && profileRaw) {
      try { set({ token, profile: JSON.parse(profileRaw) as Profile }); } catch { /* ignore */ }
    }
  },
}));
