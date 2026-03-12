import { create } from "zustand";

interface Child {
  id: string;
  childId: string;
  name: string;
  username: string;
  avatar: string | null;
  age: number | null;
  level: number;
  xpPoints: number;
}

interface GameLevel {
  id: string;
  levelNumber: number;
  name: string;
  description: string | null;
  targetScore: number;
  maxTimeSec: number | null;
  config: any;
  progress: {
    bestScore: number;
    starsEarned: number;
    attemptsCount: number;
    unlocked: boolean;
    lastPlayedAt: string | null;
  };
  canPlay: boolean;
}

interface Game {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: "ARCADE" | "QUESTION";
  minAge: number | null;
  maxAge: number | null;
  icon: string | null;
  totalLevels: number;
  unlockedLevels: number;
  totalStars: number;
  levels: GameLevel[];
}

interface PlayzoneOverview {
  child: Child;
  games: Game[];
}

interface PlayzoneStore {
  overview: PlayzoneOverview | null;
  lastFetched: number | null;
  isLoading: boolean;
  setOverview: (overview: PlayzoneOverview | null) => void;
  setLoading: (loading: boolean) => void;
  shouldRefresh: () => boolean;
  clearStore: () => void;
}

export const usePlayzoneStore = create<PlayzoneStore>((set, get) => ({
  overview: null,
  lastFetched: null,
  isLoading: false,

  setOverview: (overview) =>
    set({
      overview,
      lastFetched: overview ? Date.now() : null,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Refresh if data is older than 5 minutes (300000ms)
  shouldRefresh: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    return Date.now() - lastFetched > 300000;
  },

  clearStore: () =>
    set({
      overview: null,
      lastFetched: null,
      isLoading: false,
    }),
}));
