import { describe, it, expect } from "vitest";
import { localityName, validTimeZone, validCoordinates, validPlace } from "./location";
describe("saved location validation", () => {
  it("uses city or locality names instead of coordinates", () => {
    expect(localityName({city:"القاهرة", countryName:"مصر"})).toBe("القاهرة، مصر");
    expect(localityName({city:"", locality:"الدقي", countryName:"مصر"})).toBe("الدقي، مصر");
    expect(localityName({principalSubdivision:"الجيزة"})).toBe("الجيزة");
    expect(localityName({latitude:30, longitude:31})).toBeNull();
  });
  it("rejects invalid zones before prayer calculations", () => {
    expect(validTimeZone(undefined)).toBe(false);
    expect(validTimeZone("invalid/zone")).toBe(false);
    expect(validTimeZone("Africa/Cairo")).toBe(true);
  });
  it("rejects invalid coordinates and corrupted saved locations", () => {
    expect(validCoordinates(NaN, 31)).toBe(false);
    expect(validCoordinates(91, 31)).toBe(false);
    expect(validCoordinates(30, 181)).toBe(false);
    expect(validPlace({name:"Cairo",lat:30,lon:31})).toBe(false);
    expect(validPlace({name:"Cairo",lat:30,lon:31,timezone:"Africa/Cairo"})).toBe(true);
  });
});
