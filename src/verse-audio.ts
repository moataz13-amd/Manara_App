import type { Surah } from "./data";

export const verseReciters = [
  ["ar.alafasy", "مشاري العفاسي"],
  ["ar.abdulsamad", "عبدالباسط عبدالصمد"],
  ["ar.husary", "محمود خليل الحصري"],
  ["ar.husarymujawwad", "محمود خليل الحصري (المجود)"],
  ["ar.abdurrahmaansudais", "عبدالرحمن السديس"],
  ["ar.saoodshuraym", "سعود الشريم"],
  ["ar.mahermuaiqly", "ماهر المعيقلي"],
  ["ar.ahmedajamy", "أحمد بن علي العجمي"],
  ["ar.hudhaify", "علي الحذيفي"],
  ["ar.shaatree", "أبو بكر الشاطري"],
  ["ar.abdullahbasfar", "عبد الله بصفر"],
  ["ar.muhammadayyoub", "محمد أيوب"],
] as const;
export type RecitationScope = "ayah" | "surah";
export interface VerseRecording { number: number; numberInSurah: number; audio: string }

export async function fetchVerseRecordings(surah: Surah, ayahNumber: number, edition: string, scope: RecitationScope, signal?: AbortSignal): Promise<VerseRecording[]> {
  const ayah = surah.ayahs.find((a) => a.numberInSurah === ayahNumber);
  if (!ayah || !verseReciters.some(([id]) => id === edition)) throw new Error("اختيار تلاوة غير صالح");
  const path = scope === "surah" ? `surah/${surah.number}` : `ayah/${ayah.number}`;
  const response = await fetch(`https://api.alquran.cloud/v1/${path}/${edition}`, { signal });
  if (!response.ok) throw new Error("تعذر تحميل التلاوة");
  const source = await response.json();
  const recordings = scope === "surah" ? source.data?.ayahs : [source.data];
  const expected = scope === "surah" ? surah.ayahs : [ayah];
  if (source.data?.edition?.identifier !== edition || !Array.isArray(recordings) || recordings.length !== expected.length || recordings.some((entry, index) =>
    entry?.number !== expected[index].number || entry?.numberInSurah !== expected[index].numberInSurah || typeof entry?.audio !== "string" || !entry.audio.startsWith("https://"))) throw new Error("تلاوة غير متاحة");
  return recordings;
}
