import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Surah } from "./data";
import { getLoadedMushafPage, loadMushafPage, type MushafVerse } from "./mushaf-loader";

export default function MushafLines({ page, surahs, selected, onSelect }: {
  page: number; surahs: Surah[]; selected: string | null;
  onSelect: (key: string) => void;
}) {
  const [data, setData] = useState<{ page: number; verses: MushafVerse[] } | null>(null);
  const [failedPage, setFailedPage] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const verses = data?.page === page ? data.verses : getLoadedMushafPage(page);
  const ready = !!verses;
  useEffect(() => {
    let active = true;
    setFailedPage(null);
    loadMushafPage(page).then((verses) => {
      if (active) {
        setData({ page, verses });
        for (const neighbor of [page - 1, page + 1]) {
          if (neighbor >= 1 && neighbor <= 604) void loadMushafPage(neighbor).catch(() => {});
        }
      }
    }).catch(() => { if (active) setFailedPage(page); });
    return () => { active = false; };
  }, [page, attempt]);
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
  if (!ready) return <div className="qpc-page qpc-status" role="status" aria-live="polite">
    {failedPage === page ? <><p>تعذر تحميل صفحة المصحف. تحقق من الاتصال وأعد المحاولة.</p>
      <button className="primary" onClick={(event) => { event.stopPropagation(); setAttempt((value) => value + 1); }}>إعادة المحاولة</button></>
      : <p>جارٍ تحميل صفحة المصحف…</p>}
  </div>;
  const lines = new Map<number, { key: string; code: string }[]>();
  const headings = new Map<number, number>();
  for (const verse of verses!) {
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
      const headingSurah = surahs.find((surah) => surah.number === heading);
      const basmala = headings.get(line - 1);
      return <div className="qpc-line" key={line}>
        {words ? <span className="qpc-line-text" style={{ fontFamily: `MushafPage${page}` }}>
          {words.map((word, index) => <span key={index} data-verse-key={word.key}
            className={selected === word.key ? "verse-selected" : undefined}
            onClick={(event) => { event.stopPropagation(); onSelect(word.key); }}
            onContextMenu={(event) => event.preventDefault()}
          >{word.code}{index < words.length - 1 ? " " : ""}</span>)}
        </span> : headingSurah ? <div className="qpc-surah-title mushaf-surah-heading supplied-surah-frame">
          <img src="/images/surah-frame.svg" alt="" aria-hidden="true" draggable={false} />
          <h1 className="mushaf-surah-name" aria-label={headingSurah.name} dir="ltr">{String(headingSurah.number).padStart(3, "0")}</h1>
          <span className="frame-juz"><span>الجزء</span><b>{headingSurah.ayahs[0].juz.toLocaleString("ar-EG")}</b></span>
          <span className="frame-surah-order"><span>ترتيبها</span><b>{headingSurah.number.toLocaleString("ar-EG")}</b></span>
        </div>
          : basmala && basmala !== 9 ? <span className="qpc-basmala basmala-artwork" role="img" aria-label="بسم الله الرحمن الرحيم" /> : null}
      </div>;
    })}
  </div>;
}
