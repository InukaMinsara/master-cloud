import { create } from 'zustand';
import { ProfileRecord } from '@/types/database';
import { api } from '@/services/api';
import { localDb } from '@/services/localDb';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useFileStore } from './fileStore';

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

      // Subscribe to Supabase auth changes once
      if (isSupabaseConfigured && !isAuthListenerInitialized) {
        isAuthListenerInitialized = true;
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const meta = session.user.user_metadata || {};
            const identityMeta = session.user.identities?.[0]?.identity_data || {};
            const realEmail = session.user.email || meta.email || identityMeta.email || '';
            const realName =
              meta.full_name ||
              meta.name ||
              identityMeta.full_name ||
              identityMeta.name ||
              meta.display_name ||
              (realEmail ? realEmail.split('@')[0] : 'Master Cloud User');
            const realAvatar =
              meta.avatar_url ||
              meta.picture ||
              identityMeta.avatar_url ||
              identityMeta.picture ||
              null;

            const role = (realEmail.toLowerCase().startsWith('admin@') || realEmail.toLowerCase() === 'immaster2024@gmail.com') ? 'admin' : 'user';
            const immediateUser: ProfileRecord = {
              id: session.user.id,
              email: realEmail,
              display_name: realName,
              avatar_url: realAvatar,
              role,
              created_at: session.user.created_at,
              updated_at: new Date().toISOString(),
            };
            localDb.setCurrentUser(immediateUser);
            api.syncActiveWebSession(immediateUser);
            try {
              Promise.resolve(supabase.from('profiles').upsert({
                id: session.user.id,
                email: realEmail,
                display_name: immediateUser.display_name,
                avatar_url: immediateUser.avatar_url,
                role: immediateUser.role,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' })).then(() => {
                Promise.resolve(supabase.from('storage_quotas').upsert({
                  user_id: session.user.id,
                  total_quota_bytes: 10995116277760,
                  used_storage_bytes: 0,
                }, { onConflict: 'user_id' })).catch(() => {});
              }).catch(() => {});
            } catch { /* ignore */ }
            set({ user: immediateUser, isAuthenticated: true, isLoading: false });
            useFileStore.getState().fetchItems().catch(() => {});

            const currentUser = await api.getCurrentUser();
            if (currentUser) {
              set({ user: currentUser, isAuthenticated: true, isLoading: false });
              useFileStore.getState().fetchItems().catch(() => {});
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false, isLoading: false });
            useFileStore.getState().fetchItems().catch(() => {});
          }
        });
      }

      // Immediate session check via Supabase
      if (isSupabaseConfigured) {
        try {
          if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (code) {
              await supabase.auth.exchangeCodeForSession(code).catch(() => {});
              window.history.replaceState(null, '', window.location.pathname);
            }
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const meta = session.user.user_metadata || {};
            const identityMeta = session.user.identities?.[0]?.identity_data || {};
            const realEmail = session.user.email || meta.email || identityMeta.email || '';
            const realName =
              meta.full_name ||
              meta.name ||
              identityMeta.full_name ||
              identityMeta.name ||
              meta.display_name ||
              (realEmail ? realEmail.split('@')[0] : 'Master Cloud User');
            const realAvatar =
              meta.avatar_url ||
              meta.picture ||
              identityMeta.avatar_url ||
              identityMeta.picture ||
              null;

            const role = (realEmail.toLowerCase().startsWith('admin@') || realEmail.toLowerCase() === 'immaster2024@gmail.com') ? 'admin' : 'user';
            const immediateUser: ProfileRecord = {
              id: session.user.id,
              email: realEmail,
              display_name: realName,
              avatar_url: realAvatar,
              role,
              created_at: session.user.created_at,
              updated_at: new Date().toISOString(),
            };
            localDb.setCurrentUser(immediateUser);
            api.syncActiveWebSession(immediateUser);
            try {
              Promise.resolve(supabase.from('profiles').upsert({
                id: session.user.id,
                email: realEmail,
                display_name: immediateUser.display_name,
                avatar_url: immediateUser.avatar_url,
                role: immediateUser.role,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' })).then(() => {
                Promise.resolve(supabase.from('storage_quotas').upsert({
                  user_id: session.user.id,
                  total_quota_bytes: 10995116277760,
                  used_storage_bytes: 0,
                }, { onConflict: 'user_id' })).catch(() => {});
              }).catch(() => {});
            } catch { /* ignore */ }
            set({ user: immediateUser, isAuthenticated: true, isLoading: false });
            useFileStore.getState().fetchItems().catch(() => {});
            if (typeof window !== 'undefined' && window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            return;
          }
        } catch {
          // Fallback to api.getCurrentUser()
        }
      }

      const user = await api.getCurrentUser();
      set({
        user,
        isAuthenticated: Boolean(user && user.email),
        isLoading: false,
      });
      useFileStore.getState().fetchItems().catch(() => {});
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
      useFileStore.getState().fetchItems().catch(() => {});
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
      useFileStore.getState().fetchItems().catch(() => {});
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
      useFileStore.getState().fetchItems().catch(() => {});
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
      useFileStore.getState().fetchItems().catch(() => {});
      return { success: true, user: res.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    }
  },

  logout: async () => {
    await api.logout();
    set({ user: null, isAuthenticated: false });
    useFileStore.getState().fetchItems().catch(() => {});
  },

  updateProfile: async (updates) => {
    const updated = await api.updateProfile(updates);
    set({ user: updated });
  },
}));
