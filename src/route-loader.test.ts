import { describe, it, expect } from "vitest";
import { isStaleChunkError } from "./route-loader";
describe("route loading failures", () => {
  it("recognizes removed lazy assets in Chrome, Safari and Firefox", () => {
    for (const message of ["Failed to fetch dynamically imported module: /assets/settings-old.js", "Importing a module script failed.", "error loading dynamically imported module: /assets/settings.js"]) expect(isStaleChunkError(new Error(message))).toBe(true);
  });
  it("does not mask real application errors", () => {
    expect(isStaleChunkError(new Error("Invalid time zone specified"))).toBe(false);
    expect(isStaleChunkError(new Error("supabaseUrl is required"))).toBe(false);
  });
});
