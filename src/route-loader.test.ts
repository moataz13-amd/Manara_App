import { describe, it, expect, vi } from "vitest";
import { isStaleChunkError, preloadable } from "./route-loader";
describe("navigation preloading", () => {
  it("shares a single import between preloading and navigation", async () => {
    const module = { default: "page" };
    const loader = vi.fn().mockResolvedValue(module);
    const load = preloadable(loader);
    const first = load();
    expect(load()).toBe(first);
    expect(await first).toBe(module);
    expect(await load()).toBe(module);
    expect(loader).toHaveBeenCalledTimes(1);
  });
  it("retries a failed preload on navigation", async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce("page");
    const load = preloadable(loader);
    await expect(load()).rejects.toThrow("offline");
    await expect(load()).resolves.toBe("page");
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
describe("route loading failures", () => {
  it("recognizes removed lazy assets in Chrome, Safari and Firefox", () => {
    for (const message of ["Failed to fetch dynamically imported module: /assets/settings-old.js", "Importing a module script failed.", "error loading dynamically imported module: /assets/settings.js"]) expect(isStaleChunkError(new Error(message))).toBe(true);
  });
  it("does not mask real application errors", () => {
    expect(isStaleChunkError(new Error("Invalid time zone specified"))).toBe(false);
    expect(isStaleChunkError(new Error("supabaseUrl is required"))).toBe(false);
  });
});
