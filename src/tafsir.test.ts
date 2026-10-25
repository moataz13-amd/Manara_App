import { describe, expect, it } from "vitest";
import quran from "../public/data/quran.json";
import tafsir from "../public/data/tafsir-muyassar.json";

describe("Muyassar tafsir source integrity", () => {
  it("matches every Quran verse by surah, local number and global number", () => {
    expect(tafsir.data.edition.identifier).toBe("ar.muyassar");
    expect(tafsir.data.edition.type).toBe("tafsir");
    expect(tafsir.data.surahs).toHaveLength(114);
    expect(tafsir.data.surahs.flatMap((s) => s.ayahs)).toHaveLength(6236);
    for (const surah of quran.data.surahs) {
      const explanation = tafsir.data.surahs.find((s) => s.number === surah.number)!;
      expect(explanation.ayahs).toHaveLength(surah.ayahs.length);
      for (const ayah of surah.ayahs) {
        const entry = explanation.ayahs.find((a) => a.numberInSurah === ayah.numberInSurah)!;
        expect(entry.number).toBe(ayah.number);
        expect(entry.text.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
