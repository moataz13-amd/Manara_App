import SwipePages from "./swipe-pages";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Heart, Copy, Check, ExternalLink, BookOpen } from "lucide-react";
import { Heading, Status, Empty } from "./ui";
import { normalize } from "./data";
import { usePrefs } from "./store";
interface Hadith { hadithnumber: number; text: string; grades?: { name: string; grade: string }[]; reference?: { book: number; hadith: number }; }
const books = [
  { id: "nawawi", name: "الأربعون النووية", slug: "nawawi40" },
  { id: "bukhari", name: "صحيح البخاري", slug: "bukhari" },
  { id: "muslim", name: "صحيح مسلم", slug: "muslim" },
  { id: "tirmidhi", name: "جامع الترمذي", slug: "tirmidhi" },
  { id: "abudawud", name: "سنن أبي داود", slug: "abudawud" },
  { id: "nasai", name: "سنن النسائي", slug: "nasai" },
  { id: "ibnmajah", name: "سنن ابن ماجه", slug: "ibnmajah" },
];
export default function HadithPage() {
  const [bookId, setBookId] = useState("nawawi");
  const book = books.find((entry) => entry.id === bookId)!;
  const query = useQuery({ queryKey: ["hadith", bookId], queryFn: async () => {
    const response = await fetch(bookId === "nawawi" ? "/data/hadith.json" : `/data/hadith-books/${bookId}.json`);
    if (!response.ok) throw new Error("تعذر تحميل الأحاديث");
    return (await response.json() as { hadiths: Hadith[] }).hadiths.filter((hadith) => hadith.text.trim()).map((hadith) => ({ ...hadith, text: hadith.text.replace(/<br\s*\/?\s*>/gi, "\n") }));
  }, staleTime: Infinity });
  const oldFavorites = usePrefs((state) => state.hadithFavorites);
  const savedKeys = usePrefs((state) => state.hadithSavedKeys);
  const favorites = [...savedKeys, ...oldFavorites.map((id) => `nawawi:${id}`)];
  const set = usePrefs((state) => state.set);
  const [search, setSearch] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  if (query.isPending) return <Status />;
  if (query.isError) return <Status error retry={() => query.refetch()} />;
  const matches = query.data.filter((hadith) => (!onlySaved || favorites.includes(`${bookId}:${hadith.hadithnumber}`)) && normalize(hadith.text + " " + hadith.hadithnumber).includes(normalize(search)));
  return <>
    <Heading title="الأحاديث النبوية" subtitle="من هدي النبي ﷺ، علمٌ يُنير القلب والعمل." />
    <div className="library-banner patterned"><BookOpen size={38} /><div><h2>{book.name}</h2><p>{query.data.length.toLocaleString("ar-EG")} حديثًا ورواية في هذه المجموعة، مع الترقيم والتخريج المتاحين في المصدر.</p></div></div>
    <label className="hadith-book-filter">اختر كتاب الحديث
      <select className="input" value={bookId} onChange={(event) => { setBookId(event.target.value); setSearch(""); }}>{books.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select>
    </label>
    <div className="filter-bar">
      <div className="tabs"><button className={!onlySaved ? "active" : ""} onClick={() => { setOnlySaved(false); }}>كل الأحاديث</button><button className={onlySaved ? "active" : ""} onClick={() => { setOnlySaved(true); }}><Heart size={16} /> المفضلة</button></div>
      <label className="search"><Search size={18} /><input aria-label="البحث في الأحاديث" placeholder="ابحث في نص الحديث أو برقمه…" value={search} onChange={(event) => { setSearch(event.target.value); }} /></label>
    </div>
    <p className="hadith-result-count" role="status">{matches.length.toLocaleString("ar-EG")} حديثًا</p>
    {copyError && <p role="alert">تعذّر النسخ، يمكنك تحديد نص الحديث ونسخه.</p>}
    <SwipePages key={`${bookId}:${search}:${onlySaved}`} label="الأحاديث النبوية" count={matches.length} renderPage={(index) => {
        const hadith = matches[index];
        const key = `${bookId}:${hadith.hadithnumber}`;
        const sourceUrl = bookId === "nawawi" ? `https://sunnah.com/nawawi40:${hadith.hadithnumber}` : hadith.reference ? `https://sunnah.com/${book.slug}/${hadith.reference.book}/${hadith.reference.hadith}` : `https://sunnah.com/${book.slug}`;
        const saved = favorites.includes(`${bookId}:${hadith.hadithnumber}`);
        return <article className="hadith-card" key={key}>
          <header><h2>الحديث {hadith.hadithnumber.toLocaleString("ar-EG")}</h2><span className="pill">{book.name}</span></header>
          <p className="hadith-text">{hadith.text}</p>
          {!!hadith.grades?.length && <details className="hadith-grades"><summary>درجات الحديث كما وردت في المصدر</summary><ul>{hadith.grades.map((grade, index) => <li key={index}>{grade.name}: {grade.grade}</li>)}</ul></details>}
          <footer>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">المصدر والتخريج <ExternalLink size={15} /></a>
            <div><button aria-label={saved ? "إزالة الحديث من المفضلة" : "حفظ الحديث في المفضلة"} aria-pressed={saved} onClick={() => set({ hadithSavedKeys: saved ? savedKeys.filter((id) => id !== key) : [...savedKeys, key], hadithFavorites: bookId === "nawawi" && saved ? oldFavorites.filter((id) => id !== hadith.hadithnumber) : oldFavorites })}><Heart size={19} fill={saved ? "currentColor" : "none"} /></button>
            <button aria-label="نسخ الحديث" onClick={async () => { try { await navigator.clipboard.writeText(`${hadith.text}\n${book.name}، الحديث ${hadith.hadithnumber}\n${sourceUrl}`); setCopied(key); setCopyError(false); } catch { setCopyError(true); } }}>{copied === key ? <Check size={19} /> : <Copy size={19} />}</button></div>
          </footer>
        </article>;
      }} />
    {!matches.length && <Empty>{onlySaved ? "لا توجد أحاديث محفوظة تطابق البحث." : "لا توجد أحاديث تطابق البحث."}</Empty>}
  </>;
}
