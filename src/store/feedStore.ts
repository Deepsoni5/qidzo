import { create } from "zustand";
import { getFeedPosts, type FeedPost } from "@/actions/feed";

interface FeedState {
  // Posts data
  posts: FeedPost[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;

  // Category filter
  categoryIds: string[];

  // Actions
  setPosts: (posts: FeedPost[]) => void;
  addPosts: (newPosts: FeedPost[]) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setCategoryIds: (categoryIds: string[]) => void;

  // Complex actions
  loadMorePosts: () => Promise<void>;
  resetFeed: () => void;
  refreshFeed: () => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  // Initial state
  posts: [],
  page: 1,
  hasMore: true,
  isLoading: false,
  categoryIds: [],

  // Simple setters
  setPosts: (posts) => set({ posts }),

  addPosts: (newPosts) =>
    set((state) => {
      // Filter out duplicates
      const existingIds = new Set(state.posts.map((p) => p.id));
      const uniqueNewPosts = newPosts.filter((p) => !existingIds.has(p.id));
      return { posts: [...state.posts, ...uniqueNewPosts] };
    }),

  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setIsLoading: (isLoading) => set({ isLoading }),

  setCategoryIds: (categoryIds) => {
    const state = get();
    // Only reset if categories actually changed
    const categoriesChanged =
      JSON.stringify(state.categoryIds) !== JSON.stringify(categoryIds);
    if (categoriesChanged) {
      set({
        categoryIds,
        posts: [],
        page: 1,
        hasMore: true,
      });
    }
  },

  // Load more posts (infinite scroll)
  loadMorePosts: async () => {
    const state = get();

    if (state.isLoading || !state.hasMore) return;

    set({ isLoading: true });

    try {
      const newPosts = await getFeedPosts(state.page, 10, state.categoryIds);

      if (newPosts.length === 0) {
        set({ hasMore: false, isLoading: false });
      } else {
        // Add new posts and increment page
        get().addPosts(newPosts);
        set({
          page: state.page + 1,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Failed to load feed:", error);
      set({ isLoading: false });
    }
  },

  // Reset feed (for category changes or manual refresh)
  resetFeed: () =>
    set({
      posts: [],
      page: 1,
      hasMore: true,
      isLoading: false,
    }),

  // Refresh feed (pull-to-refresh)
  refreshFeed: async () => {
    set({
      posts: [],
      page: 1,
      hasMore: true,
      isLoading: true,
    });

    try {
      const newPosts = await getFeedPosts(1, 10, get().categoryIds);
      set({
        posts: newPosts,
        page: 2,
        hasMore: newPosts.length > 0,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to refresh feed:", error);
      set({ isLoading: false });
    }
  },
}));
