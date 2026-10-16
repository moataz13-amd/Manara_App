import { create } from "zustand";
import { persist } from "zustand/middleware";
export interface Place {
  name: string;
  lat: number;
  lon: number;
  timezone: string;
}
interface Preferences {
  reminders: boolean;
  reminderOffset: number;
  theme: string;
  fontSize: number;
  place: Place | null;
  method: string;
  hanafi: boolean;
  hour12: boolean;
  last: { surah: number; ayah: number };
  bookmarks: string[];
  counts: Record<string, number>;
  favorites: number[];
  tasbih: number;
  target: number;
  reciter: number;
  set: (
    patch: Partial<Omit<Preferences, "set" | "toggleBookmark" | "increment">>,
  ) => void;
  toggleBookmark: (id: string) => void;
  increment: (id: string, max: number) => void;
}
export const usePrefs = create<Preferences>()(
  persist(
    (set) => ({
      reminders: false,
      reminderOffset: 0,
      theme: "light",
      fontSize: 30,
      place: null,
      method: "Egyptian",
      hanafi: false,
      hour12: true,
      last: { surah: 20, ayah: 1 },
      bookmarks: [],
      counts: {},
      favorites: [],
      tasbih: 0,
      target: 33,
      reciter: 112,
      set: (patch) => set(patch),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((b) => b !== id)
            : [...s.bookmarks, id],
        })),
      increment: (id, max) =>
        set((s) => ({
          counts: { ...s.counts, [id]: Math.min((s.counts[id] || 0) + 1, max) },
        })),
    }),
    { name: "manara-preferences" },
  ),
);
