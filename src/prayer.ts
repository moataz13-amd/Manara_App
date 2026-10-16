import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";
import { useEffect, useState } from "react";
import { usePrefs, type Place } from "./store";
export const prayerNames: Record<string, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};
export function localDate(now: Date, zone: string, offset = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return new Date(value("year"), value("month") - 1, value("day") + offset, 12);
}
export function schedule(
  place: Place,
  method: string,
  hanafi: boolean,
  now: Date,
  offset = 0,
) {
  const params =
    method === "MuslimWorldLeague"
      ? CalculationMethod.MuslimWorldLeague()
      : method === "UmmAlQura"
        ? CalculationMethod.UmmAlQura()
        : CalculationMethod.Egyptian();
  params.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
  const times = new PrayerTimes(
    new Coordinates(place.lat, place.lon),
    localDate(now, place.timezone, offset),
    params,
  );
  return Object.keys(prayerNames).map((key) => ({
    key,
    name: prayerNames[key],
    time: times[key as keyof PrayerTimes] as Date,
  }));
}
export function nextPrayer(
  rows: ReturnType<typeof schedule>,
  tomorrow: ReturnType<typeof schedule>,
  now: Date,
) {
  return [...rows, ...tomorrow].find(
    (p) => p.key !== "sunrise" && p.time > now,
  );
}
export function usePrayer() {
  const { place, method, hanafi, hour12 } = usePrefs();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const rows = place ? schedule(place, method, hanafi, now) : [];
  const next = place
    ? nextPrayer(rows, schedule(place, method, hanafi, now, 1), now)
    : undefined;
  const seconds = next
    ? Math.max(0, Math.floor((+next.time - +now) / 1000))
    : 0;
  return {
    rows,
    next,
    now,
    countdown: [
      Math.floor(seconds / 3600),
      Math.floor((seconds % 3600) / 60),
      seconds % 60,
    ]
      .map((v) => String(v).padStart(2, "0"))
      .join(" : "),
    format: (date: Date) =>
      !Number.isFinite(+date)
        ? "غير متاح"
        : new Intl.DateTimeFormat("ar-EG", {
            timeZone: place?.timezone,
            hour: "numeric",
            minute: "2-digit",
            hour12,
          }).format(date),
  };
}
