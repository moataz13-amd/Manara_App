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

export function localityName(value: unknown): string | null {
  const data = value as Record<string, unknown> | null;
  if (!data) return null;
  const clean = (key: string) => typeof data[key] === "string" ? (data[key] as string).trim() : "";
  const city = clean("city") || clean("locality") || clean("principalSubdivision");
  const country = clean("countryName");
  return city ? [...new Set([city, country].filter(Boolean))].join("، ") : null;
}

// Only called with the current coordinates returned by the browser's location permission.
export async function resolveCurrentCity(lat: number, lon: number, signal: AbortSignal) {
  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ar`, { signal });
  if (!response.ok) throw new Error("City lookup failed");
  const name = localityName(await response.json());
  if (!name) throw new Error("City unavailable");
  return name;
}
