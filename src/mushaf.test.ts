import { describe, it, expect } from "vitest";
import quran from "../public/data/quran.json";
import { pageGroups, splitOpening } from "./mushaf";
import { normalize } from "./data";
const surahs = quran.data.surahs;
const basmala = surahs[0].ayahs[0].text.replace(/^\uFEFF/, "");
describe("Mushaf pagination", () => {
  it("includes every ayah exactly once across 604 source pages", () => {
    const numbers = Array.from({ length: 604 }, (_, i) =>
      pageGroups(surahs, i + 1),
    )
      .flat()
      .flatMap((g) => g.ayahs.map((a) => a.number));
    expect(numbers).toEqual(Array.from({ length: 6236 }, (_, i) => i + 1));
  });
  it("opens Aal Imran on source page 50 and keeps adjacent surahs on shared pages", () => {
    expect(pageGroups(surahs, 50)[0].surah.number).toBe(3);
    expect(pageGroups(surahs, 604).map((g) => g.surah.number)).toEqual([
      112, 113, 114,
    ]);
  });
  it("separates the source basmala without dropping any opening verse text", () => {
    for (const s of surahs) {
      const a = s.ayahs[0];
      const result = splitOpening(s.number, a, basmala);
      if (s.number === 9) {
        expect(result.basmala).toBe("");
        expect(result.text).toBe(a.text);
      } else if (s.number === 1) {
        expect(normalize(result.basmala)).toBe(normalize(basmala));
        expect(result.text).toBe("");
      } else {
        expect(normalize(result.basmala)).toBe(normalize(basmala));
        expect(result.basmala + " " + result.text).toBe(a.text);
      }
    }
  });
  it("leaves the basmala within An-Naml verse 30 untouched", () => {
    const a = surahs[26].ayahs[29];
    expect(splitOpening(27, a, basmala)).toEqual({ basmala: "", text: a.text });
  });
});
