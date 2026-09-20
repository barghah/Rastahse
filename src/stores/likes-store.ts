"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LikesStore {
  likedIds: string[]; // product IDs

  toggleLike: (productId: string) => void;
  isLiked: (productId: string) => boolean;
  getLikedIds: () => string[];
}

export const useLikesStore = create<LikesStore>()(
  persist(
    (set, get) => ({
      likedIds: [],

      toggleLike: (productId) =>
        set((state) => ({
          likedIds: state.likedIds.includes(productId)
            ? state.likedIds.filter((id) => id !== productId)
            : [...state.likedIds, productId],
        })),

      isLiked: (productId) => get().likedIds.includes(productId),

      getLikedIds: () => get().likedIds,
    }),
    {
      name: "rastah-likes",
    }
  )
);
