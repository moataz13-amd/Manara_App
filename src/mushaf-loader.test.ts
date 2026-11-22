import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const page = {
  verses: [
    {
      verse_key: "2:106",
      words: [{ code_v2: "ﱁ", line_number: 1, page_number: 17 }],
    },
  ],
};
beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Mushaf loading", () => {
  it("waits for the matching font and shares concurrent page requests", async () => {
    let finish!: () => void;
    const fontLoaded = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const add = vi.fn();
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => page });
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("document", { fonts: { add } });
    vi.stubGlobal(
      "FontFace",
      class {
        load() {
          return fontLoaded.then(() => this);
        }
      },
    );
    const { loadMushafPage } = await import("./mushaf-loader");
    const first = loadMushafPage(17);
    expect(loadMushafPage(17)).toBe(first);
    let ready = false;
    void first.then(() => {
      ready = true;
    });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(ready).toBe(false);
    finish();
    await expect(first).resolves.toEqual(page.verses);
    expect(add).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe("/data/mushaf/17.json");
  });
  it("allows retry after a failed request instead of caching a rejection", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValue({ ok: true, json: async () => page });
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("document", { fonts: { add: vi.fn() } });
    vi.stubGlobal(
      "FontFace",
      class {
        async load() {
          return this;
        }
      },
    );
    const { loadMushafPage } = await import("./mushaf-loader");
    await expect(loadMushafPage(17)).rejects.toThrow();
    await expect(loadMushafPage(17)).resolves.toEqual(page.verses);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("rejects data from a different page before displaying its glyphs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => page }),
    );
    vi.stubGlobal(
      "FontFace",
      class {
        async load() {
          return this;
        }
      },
    );
    const add = vi.fn();
    vi.stubGlobal("document", { fonts: { add } });
    const { loadMushafPage } = await import("./mushaf-loader");
    await expect(loadMushafPage(18)).rejects.toThrow(
      "بيانات صفحة المصحف غير مكتملة",
    );
    expect(add).not.toHaveBeenCalled();
  });
  it("starts the font while page data is still in flight", async () => {
    let finishData!: (value: unknown) => void;
    const load = vi.fn().mockResolvedValue({});
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            finishData = resolve;
          }),
      ),
    );
    vi.stubGlobal(
      "FontFace",
      class {
        load = load;
      },
    );
    vi.stubGlobal("document", { fonts: { add: vi.fn() } });
    const { loadMushafPage, getLoadedMushafPage } =
      await import("./mushaf-loader");
    const pending = loadMushafPage(17);
    expect(load).toHaveBeenCalledOnce();
    expect(getLoadedMushafPage(17)).toBeUndefined();
    finishData({ ok: true, json: async () => page });
    await pending;
    expect(getLoadedMushafPage(17)).toEqual(page.verses);
  });
});
