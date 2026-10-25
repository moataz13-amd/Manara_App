import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prayerClockSnapshot, subscribePrayerClock } from "./prayer-clock";

const cleanups: (() => void)[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("document", new EventTarget());
});
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.useRealTimers(); vi.unstubAllGlobals();
});
describe("live prayer clock", () => {
  it("shares one timer and removes it after the final subscriber", () => {
    const first = subscribePrayerClock(vi.fn());
    const second = subscribePrayerClock(vi.fn());
    cleanups.push(first, second);
    expect(vi.getTimerCount()).toBe(1);
    first(); expect(vi.getTimerCount()).toBe(1);
    second(); expect(vi.getTimerCount()).toBe(0);
  });
  it("updates every second using the real wall time", () => {
    vi.setSystemTime(new Date("2026-10-25T12:00:00Z"));
    cleanups.push(subscribePrayerClock(vi.fn()));
    vi.advanceTimersByTime(1000);
    expect(prayerClockSnapshot()).toBe(+new Date("2026-10-25T12:00:01Z"));
  });
  it.each(["focus", "pageshow", "visibilitychange"])("refreshes immediately after %s, including across midnight", (event) => {
    vi.setSystemTime(new Date("2026-10-25T20:59:00Z"));
    const listener = vi.fn();
    cleanups.push(subscribePrayerClock(listener));
    vi.setSystemTime(new Date("2026-10-26T05:00:00Z"));
    (event === "visibilitychange" ? document : window).dispatchEvent(new Event(event));
    expect(prayerClockSnapshot()).toBe(Date.now());
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
