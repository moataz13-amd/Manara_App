import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
describe("Bundled Madinah Mushaf", () => {
  it("contains all 6236 ayahs, 604 matching fonts and an accurate navigation index", async () => {
    const seen = new Set();
    const firstPages = new Map();
    for (let number = 1; number <= 604; number++) {
      const data = JSON.parse(await readFile(new URL(`../public/data/mushaf/${number}.json`, import.meta.url), "utf8"));
      const font = await readFile(new URL(`../public/fonts/mushaf/p${number}.woff2`, import.meta.url));
      expect(font.toString("ascii", 0, 4)).toBe("wOF2");
      expect(data.verses.length).toBeGreaterThan(0);
      for (const verse of data.verses) {
        seen.add(verse.verse_key);
        if (!firstPages.has(verse.verse_key)) firstPages.set(verse.verse_key, number);
        expect(verse.words.length).toBeGreaterThan(0);
        for (const word of verse.words) {
          expect(word.page_number).toBe(number);
          expect(word.line_number).toBeGreaterThanOrEqual(1);
          expect(word.line_number).toBeLessThanOrEqual(15);
          expect(word.code_v2.length).toBeGreaterThan(0);
        }
      }
    }
    const source = JSON.parse(await readFile(new URL("../public/data/quran.json", import.meta.url), "utf8"));
    const keys = source.data.surahs.flatMap(s => s.ayahs.map(a => `${s.number}:${a.numberInSurah}`));
    expect([...seen].sort()).toEqual([...keys].sort());
    const index = JSON.parse(await readFile(new URL("../public/data/mushaf/ayah-pages.json", import.meta.url), "utf8"));
    expect(index).toEqual(keys.map(key => firstPages.get(key)));
    // This ayah used to be silently omitted by querying the old page endpoint.
    expect(firstPages.get("5:77")).toBe(120);
  }, 20000);
});
