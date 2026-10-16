export function validTimeZone(zone: unknown): zone is string {
  if (typeof zone !== "string" || !zone.trim()) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: zone }).format(); return true; } catch { return false; }
}
export function validCoordinates(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}
export function validPlace(value: unknown) {
  const place = value as { lat?: number; lon?: number; timezone?: string; name?: string } | null;
  return !!place && typeof place.name === "string" && typeof place.lat === "number" && typeof place.lon === "number" && validCoordinates(place.lat, place.lon) && validTimeZone(place.timezone);
}
