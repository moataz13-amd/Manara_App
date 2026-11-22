export interface MushafWord {
  code_v2: string;
  line_number: number;
  page_number: number;
}
export interface MushafVerse {
  verse_key: string;
  words: MushafWord[];
}
const pages = new Map<number, Promise<MushafVerse[]>>();
const loadedPages = new Map<number, MushafVerse[]>();
export const getLoadedMushafPage = (page: number) => loadedPages.get(page);

export function loadMushafPage(page: number): Promise<MushafVerse[]> {
  if (!Number.isInteger(page) || page < 1 || page > 604) {
    return Promise.reject(new Error("رقم صفحة غير صالح"));
  }
  const cached = pages.get(page);
  if (cached) return cached;
  const pending = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const font = new FontFace(
        `MushafPage${page}`,
        `url(/fonts/mushaf/p${page}.woff2)`,
      );
      const [data, loaded] = await Promise.all([
        (async () => {
          const response = await fetch(`/data/mushaf/${page}.json`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("تعذر تحميل سطور المصحف");
          const data: { verses: MushafVerse[] } = await response.json();
          if (
            !Array.isArray(data.verses) ||
            !data.verses.length ||
            data.verses.some(
              (verse) =>
                !verse.verse_key ||
                !Array.isArray(verse.words) ||
                !verse.words.length ||
                verse.words.some(
                  (word) =>
                    !word.code_v2 ||
                    word.page_number !== page ||
                    !Number.isInteger(word.line_number) ||
                    word.line_number < 1 ||
                    word.line_number > 15,
                ),
            )
          )
            throw new Error("بيانات صفحة المصحف غير مكتملة");
          return data;
        })(),
        font.load(),
      ]);
      document.fonts.add(loaded);
      loadedPages.set(page, data.verses);
      return data.verses;
    } finally {
      clearTimeout(timer);
    }
  })();
  pages.set(page, pending);
  pending.catch(() => {
    if (pages.get(page) === pending) pages.delete(page);
  });
  return pending;
}
