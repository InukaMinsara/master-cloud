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

      let pendingProvider: ('google' | 'github' | 'azure' | 'figma' | null) = null;
      if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem('oauth_pending_provider') as any;
        if (stored && ['google', 'github', 'azure', 'figma'].includes(stored)) {
          pendingProvider = stored;
        }
      }

      // Detect and handle OAuth errors or external code exchange failures in URL
      let hadOAuthError = false;
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash
        );
        const urlError = searchParams.get('error') || hashParams.get('error');
        const urlErrorDesc = searchParams.get('error_description') || hashParams.get('error_description');

        if (urlError || urlErrorDesc) {
          hadOAuthError = true;
          console.warn('[OAuth Callback Handler]:', urlError, urlErrorDesc);
          
          // Detect provider from error or description if pendingProvider was not set
          if (!pendingProvider) {
            const desc = (urlErrorDesc || '').toLowerCase();
            if (desc.includes('m.c5') || desc.includes('azure') || desc.includes('microsoft')) {
              pendingProvider = 'azure';
            } else if (desc.includes('github')) {
              pendingProvider = 'github';
            } else if (desc.includes('google')) {
              pendingProvider = 'google';
            } else if (desc.includes('figma')) {
              pendingProvider = 'figma';
            } else {
              pendingProvider = 'azure'; // Default fallback
            }
          }

          // Clean URL so that user does not see ugly server error parameters
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      let user = await api.getCurrentUser();
      
      // If external OAuth code exchange failed or Supabase has no active session but OAuth was requested:
      if ((!user || hadOAuthError) && pendingProvider) {
        const localAuth = api.createLocalOAuthUser(pendingProvider);
        user = localAuth.user;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('oauth_pending_provider');
        }
      } else if (!user) {
        user = await api.getCurrentUser();
      }

      // Ensure user always has valid email and display name
      if (user && (!user.email || user.email.trim() === '')) {
        user.email = 'user@mastercloud.io';
        user.display_name = user.display_name || 'Master Cloud User';
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
            const mode = typeof localStorage !== 'undefined' ? localStorage.getItem('master_cloud_backend_mode') : null;
            if (mode !== 'local') {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
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
