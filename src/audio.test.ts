import { afterEach, describe, expect, it } from "vitest";
import { startRecitation, useAudio } from "./audio";
const reciter = { id: 112, name: "قارئ", moshaf: [{ id: 1, name: "حفص", server: "https://example.com/", surah_list: "1,2", surah_total: 2 }] };
const surah = { number: 1, name: "الفاتحة", englishName: "Al-Fatiha", revelationType: "Meccan", ayahs: [] };
afterEach(() => useAudio.getState().setTrack(null));
describe("recitation player display", () => {
  it("opens the full player when starting a recitation", () => {
    startRecitation(reciter, surah);
    expect(useAudio.getState().expanded).toBe(true);
    expect(useAudio.getState().track?.surah).toBe(1);
  });
  it("minimizes and reopens the same track without replacing it", () => {
    startRecitation(reciter, surah);
    const track = useAudio.getState().track;
    useAudio.getState().setExpanded(false);
    expect(useAudio.getState().track).toBe(track);
    startRecitation(reciter, surah);
    expect(useAudio.getState().track).toBe(track);
    expect(useAudio.getState().expanded).toBe(true);
  });
  it("keeps compact mode on track changes and clears it on close", () => {
    startRecitation(reciter, surah);
    useAudio.getState().setExpanded(false);
    useAudio.getState().setTrack({ ...useAudio.getState().track!, url: "https://example.com/002.mp3", surah: 2 });
    expect(useAudio.getState().expanded).toBe(false);
    useAudio.getState().setTrack(null);
    expect(useAudio.getState()).toMatchObject({ track: null, expanded: false });
  });
});
