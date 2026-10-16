import { normalize, type Surah, type Ayah } from "./data";
export function pageGroups(surahs: Surah[], page: number) {
  return surahs.flatMap((surah) => {
    const ayahs = surah.ayahs.filter((ayah) => ayah.page === page);
    return ayahs.length ? [{ surah, ayahs }] : [];
  });
}
// Read the opening from the source, rather than reconstructing Quran text.
export function splitOpening(surah: number, ayah: Ayah, basmala: string) {
  if (surah === 9 || ayah.numberInSurah !== 1)
    return { basmala: "", text: ayah.text };
  const source = ayah.text.replace(/^\uFEFF/, "");
  if (surah === 1) return { basmala: source, text: "" };
  const prefix = source.match(/^(\S+\s+\S+\s+\S+\s+\S+)\s+/)?.[1];
  return prefix && normalize(prefix) === normalize(basmala)
    ? {
        basmala: prefix,
        text: source.slice(prefix.length).trimStart(),
      }
    : { basmala: "", text: ayah.text };
}
