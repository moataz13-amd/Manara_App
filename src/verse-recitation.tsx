import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Surah } from "./data";
import { usePrefs } from "./store";
import { useAudio } from "./audio";
import { fetchVerseRecordings, verseReciters, type RecitationScope, type VerseRecording } from "./verse-audio";

export function VerseRecitation({ surah, ayahNumber }: { surah: Surah; ayahNumber: number }) {
  const saved = usePrefs((state) => state.verseReciter);
  const edition = verseReciters.some(([id]) => id === saved) ? saved : "ar.alafasy";
  const [scope, setScope] = useState<RecitationScope>("ayah");
  const audio = useQuery({
    queryKey: ["verse-recordings", surah.number, ayahNumber, edition, scope],
    queryFn: ({ signal }) => fetchVerseRecordings(surah, ayahNumber, edition, scope, signal),
    staleTime: Infinity,
  });
  return <section aria-label="خيارات التلاوة">
    <div className="verse-selectors">
      <label>الشيخ<select value={edition} onChange={(event) => usePrefs.getState().set({ verseReciter: event.target.value })}>{verseReciters.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>نطاق القراءة<select value={scope} onChange={(event) => setScope(event.target.value as RecitationScope)}><option value="ayah">الآية المحددة</option><option value="surah">السورة كاملة</option></select></label>
    </div>
    <p>{scope === "surah" ? "قراءة السورة من أولها إلى آخرها بالتتابع." : "قراءة الآية المحددة فقط."} تحتاج التلاوة إلى اتصال بالإنترنت.</p>
    {audio.isPending ? <p role="status">جارٍ تحميل التلاوة…</p> : audio.isError ? <p role="alert">تعذر تحميل التلاوة. <button onClick={() => void audio.refetch()}>إعادة المحاولة</button></p> : <RecordingPlayer key={`${surah.number}:${ayahNumber}:${edition}:${scope}`} recordings={audio.data} />}
  </section>;
}

function RecordingPlayer({ recordings }: { recordings: VerseRecording[] }) {
  const element = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const continuePlaying = useRef(false);
  const recording = recordings[index];
  useEffect(() => {
    const player = element.current;
    return () => { player?.pause(); };
  }, []);
  useEffect(() => {
    if (!continuePlaying.current) return;
    let active = true;
    void element.current?.play().catch(() => { if (active) setError("اضغط تشغيل لمتابعة التلاوة."); });
    return () => { active = false; };
  }, [index]);
  return <>
    <p role="status">الآية {recording.numberInSurah.toLocaleString("ar-EG")}{recordings.length > 1 ? ` · ${index + 1} من ${recordings.length}` : ""}</p>
    <audio ref={element} controls src={recording.audio} onPlay={() => { useAudio.getState().setTrack(null); setError(""); }} onError={() => setError("تعذر تشغيل التسجيل. تحقق من الاتصال وحاول مجددًا.")} onEnded={() => {
      if (index + 1 < recordings.length) { continuePlaying.current = true; setIndex(index + 1); }
      else continuePlaying.current = false;
    }} />
    {error && <p role="alert">{error} <button onClick={() => { element.current?.load(); void element.current?.play().catch(() => setError("تعذر تشغيل التسجيل. حاول مجددًا.")); }}>إعادة المحاولة</button></p>}
  </>;
}
