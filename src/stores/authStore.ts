import { create } from 'zustand';
import { ProfileRecord } from '@/types/database';
import { api } from '@/services/api';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthState {
  user: ProfileRecord | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: ProfileRecord | null }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string; user?: ProfileRecord | null }>;
  loginWithOAuth: (provider: 'google' | 'github' | 'azure') => Promise<{ success: boolean; redirected?: boolean; error?: string }>;
  loginWithGoogle: (email?: string, name?: string, avatar?: string) => Promise<{ success: boolean; redirected?: boolean; error?: string; user?: ProfileRecord | null }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<ProfileRecord>) => Promise<void>;
}

let isAuthListenerInitialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  init: async () => {
    try {
      set({ isLoading: true });
      const user = await api.getCurrentUser();
      set({
        user,
        isAuthenticated: Boolean(user),
        isLoading: false,
      });

      // Subscribe to Supabase auth changes once
      if (isSupabaseConfigured && !isAuthListenerInitialized) {
        isAuthListenerInitialized = true;
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
            const currentUser = await api.getCurrentUser();
            set({ user: currentUser, isAuthenticated: Boolean(currentUser), isLoading: false });
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        });
      }
    } catch (err) {
      console.error('Auth init error:', err);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  loginWithGoogle: async (email?: string, name?: string, avatar?: string) => {
    try {
      const res = await api.loginWithGoogle(email, name, avatar);
      if (res.error) {
        return { success: false, error: res.error };
      }
      if (res.redirected) {
        return { success: true, redirected: true };
      }
      set({ user: res.user, isAuthenticated: true });
      return { success: true, redirected: false, user: res.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google login failed' };
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.error) {
        return { success: false, error: res.error };
      }
      set({ user: res.user, isAuthenticated: true });
      return { success: true, user: res.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  },

  loginWithOAuth: async (provider: 'google' | 'github' | 'azure') => {
    try {
      const res = await api.loginWithOAuth(provider);
      if (res.error) {
        return { success: false, error: res.error };
      }
      if (res.redirected) {
        return { success: true, redirected: true };
      }
      set({ user: res.user, isAuthenticated: true });
      return { success: true, redirected: false };
    } catch (err: any) {
      return { success: false, error: err.message || `${provider} login failed` };
    }
  },

  signup: async (email, password, displayName) => {
    try {
      const res = await api.signup(email, password, displayName);
      if (res.error) {
        return { success: false, error: res.error };
      }
      set({ user: res.user, isAuthenticated: true });
      return { success: true, user: res.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    }
  },

  logout: async () => {
    await api.logout();
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (updates) => {
    const updated = await api.updateProfile(updates);
    set({ user: updated });
  },
}));
