import { describe, it, expect } from "vitest";
import { localDate, schedule, nextPrayer } from "./prayer";
const cairo = {
  name: "Cairo",
  lat: 30.0444,
  lon: 31.2357,
  timezone: "Africa/Cairo",
};
describe("prayer date and next prayer", () => {
  it("uses the selected zone across UTC midnight", () => {
    const date = localDate(new Date("2026-10-16T22:30:00Z"), "Africa/Cairo");
    expect(date.getDate()).toBe(17);
  });
  it("handles the preceding date in western zones", () => {
    const date = localDate(
      new Date("2026-10-16T01:00:00Z"),
      "America/Los_Angeles",
    );
    expect(date.getDate()).toBe(15);
  });
  it("keeps today prayers in chronological order", () => {
    const rows = schedule(
      cairo,
      "Egyptian",
      false,
      new Date("2026-10-16T10:00:00Z"),
    );
    expect(rows).toHaveLength(6);
    rows
      .slice(1)
      .forEach((p, i) => expect(+p.time).toBeGreaterThan(+rows[i].time));
  });
  it("advances after Isha to tomorrow Fajr and excludes sunrise", () => {
    const now = new Date("2026-10-16T20:00:00Z");
    const today = schedule(cairo, "Egyptian", false, now);
    const tomorrow = schedule(cairo, "Egyptian", false, now, 1);
    expect(nextPrayer(today, tomorrow, now)).toEqual(tomorrow[0]);
    expect(
      nextPrayer(today, tomorrow, new Date(+today[0].time + 1000))?.key,
    ).toBe("dhuhr");
  });
  it("changes Asr for Hanafi calculation", () => {
    const now = new Date("2026-10-16T10:00:00Z");
    expect(+schedule(cairo, "Egyptian", true, now)[3].time).toBeGreaterThan(
      +schedule(cairo, "Egyptian", false, now)[3].time,
    );
  });
  it("calculates valid times through Cairo DST change", () => {
    for (const date of ["2026-10-29T12:00:00Z", "2026-10-30T12:00:00Z"]) {
      expect(
        schedule(cairo, "Egyptian", false, new Date(date)).every((p) =>
          Number.isFinite(+p.time),
        ),
      ).toBe(true);
    }
  });
  it("agrees within two minutes with AlAdhan Egyptian method sample retrieved 2026-10-16", () => {
    const expected = [331, 417, 761, 957, 1103, 1181];
    const rows = schedule(
      cairo,
      "Egyptian",
      false,
      new Date("2026-10-16T10:00:00Z"),
    );
    rows.forEach((p, i) => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: cairo.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(p.time)
        .split(":")
        .map(Number);
      expect(
        Math.abs(parts[0] * 60 + parts[1] - expected[i]),
      ).toBeLessThanOrEqual(2);
    });
  });
});
