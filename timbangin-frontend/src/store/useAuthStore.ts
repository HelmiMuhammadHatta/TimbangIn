import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  setAuth: (token: string, username: string, role: string, permissions: string[]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  setAuth: (token, username, role, permissions) => 
    set({ token, username, role, permissions, isAuthenticated: true }),
  clearAuth: () => set({ token: null, username: null, role: null, permissions: [], isAuthenticated: false }),
}));
