import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NavigationLink } from '@/constants/navigation-links';

interface RecentVisit extends NavigationLink {
  visitedAt: string;
}

interface NavigationStore {
  recentVisits: RecentVisit[];
  favoriteLinks: string[]; // Store link IDs
  addRecentVisit: (link: NavigationLink) => void;
  toggleFavorite: (linkId: string) => void;
  isFavorite: (linkId: string) => boolean;
  clearRecentVisits: () => void;
}

const MAX_RECENT_VISITS = 8;

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set, get) => ({
      recentVisits: [],
      favoriteLinks: [],

      addRecentVisit: (link: NavigationLink) => {
        set((state) => {
          // Remove duplicate if exists
          const filtered = state.recentVisits.filter(
            (visit) => visit.id !== link.id
          );

          // Add new visit at the beginning
          const newVisit: RecentVisit = {
            ...link,
            visitedAt: new Date().toISOString()
          };

          // Keep only the last MAX_RECENT_VISITS items
          const updated = [newVisit, ...filtered].slice(0, MAX_RECENT_VISITS);

          return { recentVisits: updated };
        });
      },

      toggleFavorite: (linkId: string) => {
        set((state) => {
          const isFavorite = state.favoriteLinks.includes(linkId);
          if (isFavorite) {
            return {
              favoriteLinks: state.favoriteLinks.filter((id) => id !== linkId)
            };
          } else {
            return {
              favoriteLinks: [...state.favoriteLinks, linkId]
            };
          }
        });
      },

      isFavorite: (linkId: string) => {
        return get().favoriteLinks.includes(linkId);
      },

      clearRecentVisits: () => {
        set({ recentVisits: [] });
      }
    }),
    {
      name: 'navigation-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
