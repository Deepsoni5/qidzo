import { create } from "zustand";

interface UserRoleData {
  role: string;
  isParent: boolean;
  isSchool?: boolean;
  isChild: boolean;
  child?: any;
  [key: string]: any; // allow extra fields from getCurrentUserRole
}

interface UserRoleStore {
  roleData: UserRoleData | null;
  isLoading: boolean;
  lastFetched: number | null;
  setRoleData: (data: UserRoleData | null) => void;
  setLoading: (loading: boolean) => void;
  shouldRefresh: () => boolean;
  clearRoleData: () => void;
}

export const useUserRoleStore = create<UserRoleStore>((set, get) => ({
  roleData: null,
  isLoading: false,
  lastFetched: null,

  setRoleData: (data) =>
    set({
      roleData: data,
      lastFetched: data && data.role !== "guest" ? Date.now() : null,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Refresh if data is older than 5 minutes
  shouldRefresh: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    return Date.now() - lastFetched > 300000;
  },

  clearRoleData: () =>
    set({
      roleData: null,
      lastFetched: null,
      isLoading: false,
    }),
}));
