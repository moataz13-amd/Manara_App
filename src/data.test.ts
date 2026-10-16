import { describe, it, expect } from "vitest";
import quran from "../public/data/quran.json";
import { normalize } from "./data";
import { usePrefs } from "./store";
describe("Quran source integrity", () => {
  it("contains 114 surahs and 6236 continuous numbered ayahs", () => {
    const surahs = quran.data.surahs;
    expect(surahs).toHaveLength(114);
    const all = surahs.flatMap((s) => s.ayahs);
    expect(all).toHaveLength(6236);
    all.forEach((a, i) => expect(a.number).toBe(i + 1));
    surahs.forEach((s) =>
      s.ayahs.forEach((a, i) => {
        expect(a.numberInSurah).toBe(i + 1);
        expect(a.page).toBeGreaterThan(0);
        expect(a.page).toBeLessThanOrEqual(604);
      }),
    );
  });
  it("normalizes vocalized Arabic search", () =>
    expect(normalize("ٱلْفَاتِحَةِ")).toBe(normalize("الفاتحة")));
});
describe("progress", () => {
  it("caps adhkar at their source count", () => {
    usePrefs.getState().increment("test", 1);
    usePrefs.getState().increment("test", 1);
    expect(usePrefs.getState().counts.test).toBe(1);
  });
  it("toggles bookmark without duplicates", () => {
    usePrefs.getState().toggleBookmark("2:255");
    expect(usePrefs.getState().bookmarks).toContain("2:255");
    usePrefs.getState().toggleBookmark("2:255");
    expect(usePrefs.getState().bookmarks).not.toContain("2:255");
  });
});
