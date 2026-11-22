// Import the matching Quran.com QCF V2 word layout and page fonts together.
// Runtime reading must not depend on third-party API/CDN availability.
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
const root = new URL("../public/", import.meta.url);
await mkdir(new URL("data/mushaf/", root), { recursive: true });
await mkdir(new URL("fonts/mushaf/", root), { recursive: true });
const source = JSON.parse(await readFile(new URL("data/quran.json", root), "utf8"));
const expected = new Set(source.data.surahs.flatMap(s => s.ayahs.map(a => `${s.number}:${a.numberInSurah}`)));
if (process.argv.includes("--index-only")) {
  const firstPages = new Map();
  for (let page = 1; page <= 604; page++) {
    const data = JSON.parse(await readFile(new URL(`data/mushaf/${page}.json`, root), "utf8"));
    for (const verse of data.verses) {
      if (!firstPages.has(verse.verse_key)) firstPages.set(verse.verse_key, page);
    }
  }
  if (firstPages.size !== expected.size) throw new Error("Incomplete local Mushaf");
  await writeFile(new URL("data/mushaf/ayah-pages.json", root), JSON.stringify([...expected].map(key => firstPages.get(key))));
  console.log("Indexed all 6236 local ayahs");
  process.exit(0);
}
async function request(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status}: ${url}`);
      return response;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}
// Fetch by chapter: by_page uses a different edition's verse boundaries on
// some pages (e.g. 5:77), which can omit words from the actual V2 page.
const layouts = Array.from({ length: 604 }, () => new Map());
const seen = new Set();
const ayahPages = new Map();
let nextChapter = 1;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (nextChapter <= 114) {
    const chapter = nextChapter++;
    let next = 1;
    while (next !== null) {
      const data = await (await request(`https://api.quran.com/api/v4/verses/by_chapter/${chapter}?words=true&word_fields=code_v2&per_page=50&page=${next}`)).json();
      for (const verse of data.verses) {
        if (!expected.has(verse.verse_key) || seen.has(verse.verse_key)) throw new Error(`Unexpected verse ${verse.verse_key}`);
        seen.add(verse.verse_key);
        ayahPages.set(verse.verse_key, verse.words[0].page_number);
        for (const word of verse.words) {
          if (!word.code_v2 || word.line_number < 1 || word.line_number > 15 || word.page_number < 1 || word.page_number > 604) throw new Error(`Invalid word in ${verse.verse_key}`);
          const page = layouts[word.page_number - 1];
          const row = page.get(verse.verse_key) ?? { verse_key: verse.verse_key, words: [] };
          row.words.push({ code_v2: word.code_v2, line_number: word.line_number, page_number: word.page_number });
          page.set(verse.verse_key, row);
        }
      }
      next = data.pagination.next_page;
    }
  }
}));
if (seen.size !== expected.size) throw new Error(`Incomplete Quran: ${seen.size}/${expected.size}`);
console.log(`Validated all ${seen.size} ayahs; exporting V2 page boundaries`);
await writeFile(new URL("data/mushaf/ayah-pages.json", root), JSON.stringify([...expected].map(key => ayahPages.get(key))));
let nextPage = 1;
let completed = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (nextPage <= 604) {
    const page = nextPage++;
    const dataPath = new URL(`data/mushaf/${page}.json`, root);
    const fontPath = new URL(`fonts/mushaf/p${page}.woff2`, root);
    const verses = [...layouts[page - 1].values()].sort((a,b) => {
      const [ac,av] = a.verse_key.split(":").map(Number);
      const [bc,bv] = b.verse_key.split(":").map(Number);
      return ac - bc || av - bv;
    });
      if (!verses.length || verses.some(v => !expected.has(v.verse_key) || !v.words.length || v.words.some(w => !w.code_v2 || w.line_number < 1 || w.line_number > 15))) throw new Error(`Invalid page ${page}`);
    let exists = false;
    try { await access(fontPath); exists = true; } catch {}
    if (!exists) {
      const font = Buffer.from(await (await request(`https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p${page}.woff2`)).arrayBuffer());
      if (font.toString("ascii", 0, 4) !== "wOF2") throw new Error(`Invalid font ${page}`);
      await writeFile(fontPath, font);
    }
    await writeFile(dataPath, JSON.stringify({ verses }));
    completed++;
    if (completed % 50 === 0 || completed === 604) console.log(`Imported ${completed}/604 pages and matching fonts`);
  }
}));
