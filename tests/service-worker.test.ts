import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
function worker(cached: Response | undefined, fetcher: typeof fetch, write?: () => Promise<void>) {
  let handle: (event: unknown) => void;
  const put = vi.fn(write);
  runInNewContext(source, {
    URL, Response, location: { origin: "https://manara.test" }, fetch: fetcher,
    caches: { open: async () => ({ match: async () => cached, put }), match: async () => cached },
    self: { addEventListener: (name: string, listener: typeof handle) => { if (name === "fetch") handle = listener; } },
  });
  return (path: string) => {
    let response!: Promise<Response>;
    let background!: Promise<unknown>;
    handle!({ request: { url: `https://manara.test${path}`, method: "GET", mode: "navigate" }, respondWith: (value: Promise<Response>) => { response = value; }, waitUntil: (value: Promise<unknown>) => { background = value; } });
    return { response, background, put };
  };
}
describe("navigation cache", () => {
  it("finishes saving a visited page before releasing the navigation response", async () => {
    let finish!: () => void;
    const saved = new Promise<void>((resolve) => { finish = resolve; });
    const result = worker(undefined, vi.fn().mockResolvedValue(new Response("page")), () => saved)("/quran/20?page=312");
    let ready = false;
    void result.response.then(() => { ready = true; });
    await vi.waitFor(() => expect(result.put).toHaveBeenCalledOnce());
    expect(ready).toBe(false);
    finish();
    expect(await (await result.response).text()).toBe("page");
    await result.background;
  });
  it("keeps a previously saved page available when navigation loses the network", async () => {
    const result = worker(new Response("saved page"), vi.fn().mockRejectedValue(new Error("offline")))("/quran/20?page=312");
    expect(await (await result.response).text()).toBe("saved page");
    await result.background;
  });
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
