import { ProfileRecord } from './database';

export interface UserSession {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  profile: ProfileRecord;
  accessToken?: string;
}

export interface AuthState {
  user: ProfileRecord | null;
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
