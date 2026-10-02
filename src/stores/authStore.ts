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
  loginWithOAuth: (provider: 'google' | 'github' | 'azure' | 'figma') => Promise<{ success: boolean; redirected?: boolean; error?: string }>;
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

      // Detect and handle OAuth errors in URL query/hash
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash
        );
        const urlError = searchParams.get('error') || hashParams.get('error');
        const urlErrorDesc = searchParams.get('error_description') || hashParams.get('error_description');

        if (urlError) {
          console.warn('[OAuth Callback Notice]:', urlError, urlErrorDesc);
          // Clean URL so that user does not see ugly server error parameters
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      let user = await api.getCurrentUser();
      
      // If user is null, fallback to local database profile
      if (!user) {
        user = await api.getCurrentUser();
      }

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
      const fallbackUser = await api.getCurrentUser();
      set({ user: fallbackUser, isAuthenticated: Boolean(fallbackUser), isLoading: false });
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

  loginWithOAuth: async (provider: 'google' | 'github' | 'azure' | 'figma') => {
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
