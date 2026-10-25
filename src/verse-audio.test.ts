import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchVerseRecordings } from "./verse-audio";
import quran from "../public/data/quran.json";

const surah = quran.data.surahs[0];
const recording = (index: number) => ({ ...surah.ayahs[index], audio: `https://example.com/${index + 1}.mp3` });
afterEach(() => vi.unstubAllGlobals());
describe("verse and full-surah recordings", () => {
  it("requests the selected verse and reciter", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { ...recording(2), edition: { identifier: "ar.husary" } } }) });
    vi.stubGlobal("fetch", fetcher);
    expect(await fetchVerseRecordings(surah, 3, "ar.husary", "ayah")).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledWith("https://api.alquran.cloud/v1/ayah/3/ar.husary", { signal: undefined });
  });
  it("loads the entire surah in order, even when opened from a later verse", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { ayahs: surah.ayahs.map((_, index) => recording(index)), edition: { identifier: "ar.alafasy" } } }) }));
    const result = await fetchVerseRecordings(surah, 5, "ar.alafasy", "surah");
    expect(result.map((a) => a.numberInSurah)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("rejects incomplete or mismatched verse lists", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { ayahs: [recording(1)], edition: { identifier: "ar.alafasy" } } }) }));
    await expect(fetchVerseRecordings(surah, 2, "ar.alafasy", "surah")).rejects.toThrow();
  });
  it("rejects a different reciter instead of playing the wrong voice", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { ...recording(0), edition: { identifier: "ar.alafasy" } } }) }));
    await expect(fetchVerseRecordings(surah, 1, "ar.husary", "ayah")).rejects.toThrow();
  });
});
