import { useQuery } from "@tanstack/react-query";
export interface Ayah {
  number: number;
  text: string;
  displayText?: string;
  numberInSurah: number;
  juz: number;
  page: number;
}
export interface Surah {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahs: Ayah[];
}
export interface Reciter {
  id: number;
  name: string;
  moshaf: {
    id: number;
    name: string;
    server: string;
    surah_list: string;
    surah_total: number;
  }[];
}
export type DhikrRow = [
  string,
  string,
  string | null,
  number | null,
  string | null,
  string,
];
async function json<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("تعذر تحميل البيانات");
  return response.json();
}
export function useQuran() {
  return useQuery({
    queryKey: ["quran"],
    queryFn: async () => {
      const [source, display] = await Promise.all([
        json<{ data: { surahs: Surah[] } }>("/data/quran.json"),
        json<string[]>("/data/hafs-display.json"),
      ]);
      if (display.length !== 6236) throw new Error("تعذر تحميل نص المصحف");
      return source.data.surahs.map((surah) => ({
        ...surah,
        ayahs: surah.ayahs.map((ayah) => ({
          ...ayah,
          displayText: display[ayah.number - 1],
        })),
      }));
    },
    staleTime: Infinity,
  });
}
export function useReciters() {
  return useQuery({
    queryKey: ["reciters"],
    queryFn: async () =>
      (await json<{ reciters: Reciter[] }>("/data/reciters.json")).reciters,
    staleTime: Infinity,
  });
}
export function useAdhkar() {
  return useQuery({
    queryKey: ["adhkar"],
    queryFn: async () =>
      (await json<{ rows: DhikrRow[] }>("/data/adhkar.json")).rows,
    staleTime: Infinity,
  });
}
export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه");
