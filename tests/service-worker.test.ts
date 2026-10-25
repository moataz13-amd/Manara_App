import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
function worker(cached: Response | undefined, fetcher: typeof fetch) {
  let handle: (event: unknown) => void;
  const put = vi.fn();
  runInNewContext(source, {
    URL, Response, location: { origin: "https://manara.test" }, fetch: fetcher,
    caches: { open: async () => ({ match: async () => cached, put }) },
    self: { addEventListener: (name: string, listener: typeof handle) => { if (name === "fetch") handle = listener; } },
  });
  return (path: string) => {
    let response!: Promise<Response>;
    let background!: Promise<unknown>;
    handle!({ request: { url: `https://manara.test${path}`, method: "GET" }, respondWith: (value: Promise<Response>) => { response = value; }, waitUntil: (value: Promise<unknown>) => { background = value; } });
    return { response, background, put };
  };
}
describe("navigation cache", () => {
  it("serves cached data before a slow refresh finishes", async () => {
    let finish!: (response: Response) => void;
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
    const result = worker(new Response("cached"), fetcher)("/data/quran.json");
    expect(await (await result.response).text()).toBe("cached");
    finish(new Response("updated"));
    await result.background;
    expect(result.put).toHaveBeenCalledOnce();
  });
  it("reuses hashed page chunks without a network request", async () => {
    const fetcher = vi.fn();
    const result = worker(new Response("module"), fetcher)("/assets/quran-hash.js");
    expect(await (await result.response).text()).toBe("module");
    await result.background;
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("loads uncached data and keeps cached data available offline", async () => {
    const fresh = worker(undefined, vi.fn().mockResolvedValue(new Response("fresh")))("/data/adhkar.json");
    expect(await (await fresh.response).text()).toBe("fresh");
    const offline = worker(new Response("saved"), vi.fn().mockRejectedValue(new Error("offline")))("/data/quran.json");
    expect(await (await offline.response).text()).toBe("saved");
    await offline.background;
  });
});
