import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Surah } from "./data";

interface Word { code_v2: string; line_number: number; page_number: number }
interface Verse { verse_key: string; words: Word[] }
interface PageData { verses: Verse[]; pagination: { next_page: number | null } }
const pages = new Map<number, Verse[]>();
const fonts = new Map<number, Promise<FontFace>>();

async function loadPage(page: number) {
  let verses = pages.get(page);
  if (!verses) {
    const collected: Verse[] = [];
    let next: number | null = 1;
    while (next !== null) {
      const response = await fetch(`https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=code_v2&per_page=50&page=${next}`);
      if (!response.ok) throw new Error("تعذر تحميل سطور المصحف");
      const data: PageData = await response.json();
      collected.push(...data.verses);
      next = data.pagination.next_page;
    }
    verses = collected;
    pages.set(page, verses);
  }
  let font = fonts.get(page);
  if (!font) {
    font = new FontFace(`MushafPage${page}`, `url(https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p${page}.woff2)`).load();
    fonts.set(page, font);
    font.catch(() => fonts.delete(page));
  }
  document.fonts.add(await font);
  return verses;
}

export default function MushafLines({ page, surahs, selected, onSelect, onReady }: {
  page: number; surahs: Surah[]; selected: string | null;
  onSelect: (key: string) => void; onReady: (ready: boolean) => void;
}) {
  const [data, setData] = useState<{ page: number; verses: Verse[] } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const ready = data?.page === page;
  useEffect(() => {
    let active = true;
    onReady(false);
    loadPage(page).then((verses) => {
      if (active) { setData({ page, verses }); onReady(true); }
    }).catch(() => { if (active) onReady(false); });
    return () => { active = false; };
  }, [page, onReady]);
  useLayoutEffect(() => {
    if (!ready || !root.current) return;
    const el = root.current;
    const fit = () => {
      if (el.clientWidth <= 0 || el.clientHeight <= 0) return;
      const rows = Array.from(el.querySelectorAll<HTMLElement>(".qpc-line-text"));
      rows.forEach((row) => { row.style.fontSize = "40px"; });
      const widest = Math.max(...rows.map((row) => row.getBoundingClientRect().width), 1);
      const size = Math.min(40 * el.clientWidth / widest, el.clientHeight / 15 / 1.5);
      rows.forEach((row) => { row.style.fontSize = `${size}px`; });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready, page]);
  if (!ready) return null;
  const lines = new Map<number, { key: string; code: string }[]>();
  const headings = new Map<number, number>();
  for (const verse of data.verses) {
    const [surah, ayah] = verse.verse_key.split(":").map(Number);
    const words = verse.words.filter((word) => word.page_number === page);
    if (ayah === 1 && words.length) headings.set(Math.max(1, words[0].line_number - (surah === 9 ? 1 : 2)), surah);
    for (const word of words) {
      const row = lines.get(word.line_number) ?? [];
      row.push({ key: verse.verse_key, code: word.code_v2 });
      lines.set(word.line_number, row);
    }
  }
  return <div className="qpc-page" ref={root} dir="rtl" aria-label={`صفحة ${page}`}>
    {Array.from({ length: 15 }, (_, i) => i + 1).map((line) => {
      const words = lines.get(line);
      const heading = headings.get(line);
      const basmala = headings.get(line - 1);
      return <div className="qpc-line" key={line}>
        {words ? <span className="qpc-line-text" style={{ fontFamily: `MushafPage${page}` }}>
          {words.map((word, index) => <span key={index} data-verse-key={word.key}
            className={selected === word.key ? "verse-selected" : undefined}
            onClick={(event) => { event.stopPropagation(); onSelect(word.key); }}
            onContextMenu={(event) => event.preventDefault()}
          >{word.code}{index < words.length - 1 ? " " : ""}</span>)}
        </span> : heading ? <div className="qpc-surah-title">{surahs.find((s) => s.number === heading)?.name}</div>
          : basmala && basmala !== 9 ? <div className="qpc-basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div> : null}
      </div>;
    })}
  </div>;
}
