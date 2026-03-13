import { create } from "zustand";

interface ChildSession {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  level: number;
  xp_points: number;
  role: string;
}

interface ChildAuthStore {
  session: ChildSession | null;
  isLoading: boolean;
  lastFetched: number | null;
  setSession: (session: ChildSession | null) => void;
  setLoading: (loading: boolean) => void;
  shouldRefresh: () => boolean;
  clearSession: () => void;
}

export const useChildAuthStore = create<ChildAuthStore>((set, get) => ({
  session: null,
  isLoading: false,
  lastFetched: null,

  setSession: (session) =>
    set({
      session,
      lastFetched: session ? Date.now() : null,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Refresh if data is older than 5 minutes (300000ms)
  shouldRefresh: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    return Date.now() - lastFetched > 300000;
  },

  clearSession: () =>
    set({
      session: null,
      lastFetched: null,
      isLoading: false,
    }),
}));
