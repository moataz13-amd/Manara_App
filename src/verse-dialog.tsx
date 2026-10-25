import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Play, Share2, X } from "lucide-react";
import type { Surah } from "./data";
import { useAudio } from "./audio";

export type VerseView = "actions" | "tafsir" | "audio";

export function VerseDialog({ surahs, initialSurah, initialAyah, initialView, onClose, onShare }: {
  surahs: Surah[]; initialSurah: number; initialAyah: number; initialView: VerseView;
  onClose: () => void; onShare: (surah: Surah, ayah: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [surahNumber, setSurah] = useState(initialSurah);
  const [ayahNumber, setAyah] = useState(initialAyah);
  const [view, setView] = useState(initialView);
  const [audioError, setAudioError] = useState(false);
  const surah = surahs.find((s) => s.number === surahNumber)!;
  const ayah = surah.ayahs.find((a) => a.numberInSurah === ayahNumber)!;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  const tafsir = useQuery({
    queryKey: ["tafsir", "ar.muyassar"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/data/tafsir-muyassar.json", { signal });
      if (!response.ok) throw new Error("تعذر تحميل التفسير");
      const source = await response.json() as { data: { surahs: Surah[] } };
      return source.data.surahs;
    },
    enabled: view === "tafsir", staleTime: Infinity,
  });
  const explanation = tafsir.data?.find((s) => s.number === surahNumber)?.ayahs.find((a) => a.numberInSurah === ayahNumber)?.text;
  const audio = useQuery({
    queryKey: ["verse-audio", ayah.number],
    queryFn: async ({ signal }) => {
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayah.number}/ar.alafasy`, { signal });
      if (!response.ok) throw new Error("تعذر تحميل التلاوة");
      const source = await response.json();
      if (source.data?.number !== ayah.number || typeof source.data.audio !== "string" || !source.data.audio.startsWith("https://")) throw new Error("تلاوة غير متاحة");
      return source.data.audio as string;
    },
    enabled: view === "audio", staleTime: Infinity,
  });
  return createPortal(<dialog ref={dialog} className="share-dialog verse-dialog" dir="rtl" aria-labelledby="verse-dialog-title" onCancel={onClose} onKeyDown={(event) => event.stopPropagation()}>
    <header><h2 id="verse-dialog-title">{view === "tafsir" ? "التفسير الميسّر" : view === "audio" ? "قراءة الآية" : "خيارات الآية"}</h2><button aria-label="إغلاق" onClick={onClose}><X size={22} /></button></header>
    {view === "tafsir" && <div className="verse-selectors">
      <label>السورة<select value={surahNumber} onChange={(event) => { setSurah(Number(event.target.value)); setAyah(1); }}>{surahs.map((s) => <option key={s.number} value={s.number}>{s.name}</option>)}</select></label>
      <label>الآية<select value={ayahNumber} onChange={(event) => setAyah(Number(event.target.value))}>{surah.ayahs.map((a) => <option key={a.number} value={a.numberInSurah}>{a.numberInSurah.toLocaleString("ar-EG")}</option>)}</select></label>
    </div>}
    <p className="verse-reference">{surah.name} · الآية {ayahNumber.toLocaleString("ar-EG")}</p>
    <p className="verse-dialog-text">{ayah.text}</p>
    <div className="verse-dialog-actions">
      <button onClick={() => onShare(surah, ayahNumber)}><Share2 size={20} />مشاركة</button>
      <button aria-pressed={view === "tafsir"} onClick={() => setView("tafsir")}><BookOpen size={20} />تفسير</button>
      <button aria-pressed={view === "audio"} onClick={() => setView("audio")}><Play size={20} />قراءة صوتية</button>
    </div>
    {view === "tafsir" && <section className="verse-explanation" aria-label="تفسير الآية">
      <p className="verse-source">التفسير الميسّر · مجمع الملك فهد · <a href="https://alquran.cloud/api" target="_blank" rel="noreferrer">مصدر البيانات</a></p>
      {tafsir.isPending ? <p role="status">جارٍ تحميل التفسير…</p> : tafsir.isError ? <p role="alert">تعذر تحميل التفسير. <button onClick={() => void tafsir.refetch()}>إعادة المحاولة</button></p> : <p>{explanation || "تفسير هذه الآية غير متاح."}</p>}
      <div className="verse-dialog-actions"><button disabled={ayahNumber === 1} onClick={() => setAyah(ayahNumber - 1)}>الآية السابقة</button><button disabled={ayahNumber === surah.ayahs.length} onClick={() => setAyah(ayahNumber + 1)}>الآية التالية</button></div>
    </section>}
    {view === "audio" && <section aria-label="تلاوة الآية">
      <p>بصوت مشاري العفاسي · تحتاج التلاوة إلى اتصال بالإنترنت</p>
      {audio.isPending ? <p role="status">جارٍ تحميل التلاوة…</p> : audio.isError ? <p role="alert">تعذر تحميل التلاوة. <button onClick={() => void audio.refetch()}>إعادة المحاولة</button></p> : <audio key={audio.data} controls src={audio.data} onPlay={() => { useAudio.getState().setTrack(null); setAudioError(false); }} onError={() => setAudioError(true)} />}
      {audioError && <p role="alert">تعذر تشغيل التسجيل. تحقق من الاتصال ثم حاول التشغيل مجددًا.</p>}
    </section>}
  </dialog>, document.body);
}
