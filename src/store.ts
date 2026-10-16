import { create } from "zustand";
import { validPlace } from "./location";
import { persist, createJSONStorage } from "zustand/middleware";
export interface Place {
  name: string;
  lat: number;
  lon: number;
  timezone: string;
}
interface Preferences {
  hadithFavorites: number[];
  hadithSavedKeys: string[];
  listening: Record<string, { plays: number; lastPlayed: number; reciter: string }>;
  playback: { surah: number; reciter: string; position: number } | null;
  recordListening: (surah: number, reciter: string) => void;
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
      hadithFavorites: [],
      hadithSavedKeys: [],
      listening: {},
      playback: null,
      recordListening: (surah, reciter) => set((state) => ({
        listening: { ...state.listening, [surah]: {
          plays: (state.listening[surah]?.plays || 0) + 1,
          lastPlayed: Date.now(), reciter,
        } },
      })),
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
    {
      name: "manara-preferences",
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          try { const value = localStorage.getItem(key); if (value) JSON.parse(value); return value; } catch { return null; }
        },
        setItem: (key, value) => { try { localStorage.setItem(key, value); } catch { /* Keep the app usable when browser storage is unavailable. */ } },
        removeItem: (key) => { try { localStorage.removeItem(key); } catch {} },
      })),
      merge: (persisted, current) => {
        const saved = persisted as Partial<Preferences> | null;
        return { ...current, ...saved, place: validPlace(saved?.place) ? saved!.place! : null };
      },
    },
  ),
);
