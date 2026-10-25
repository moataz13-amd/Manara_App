import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Repeat, Headphones, LoaderCircle } from "lucide-react";
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
    {audio.isPending ? <p role="status">جارٍ تحميل التلاوة…</p> : audio.isError ? <p role="alert">تعذر تحميل التلاوة. <button onClick={() => void audio.refetch()}>إعادة المحاولة</button></p> : <RecordingPlayer key={`${surah.number}:${ayahNumber}:${edition}:${scope}`} recordings={audio.data} reciter={verseReciters.find(([id]) => id === edition)![1]} />}
  </section>;
}

function RecordingPlayer({ recordings, reciter }: { recordings: VerseRecording[]; reciter: string }) {
  const element = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const continuePlaying = useRef(false);
  const recording = recordings[index];
  const time = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
  useEffect(() => {
    const player = element.current;
    return () => { player?.pause(); };
  }, []);
  useEffect(() => {
    setPosition(0); setDuration(0); setError(""); setPlaying(false);
    if (!continuePlaying.current) return;
    let active = true;
    setLoading(true);
    void element.current?.play().catch(() => { if (active) { setLoading(false); setError("اضغط تشغيل لمتابعة التلاوة."); } });
    return () => { active = false; };
  }, [index]);
  const play = () => {
    setError(""); setLoading(true);
    void element.current?.play().catch(() => { setLoading(false); setError("تعذر التشغيل. تحقق من الاتصال وحاول مجددًا."); });
  };
  const move = (next: number) => {
    if (next < 0 || next >= recordings.length) return;
    continuePlaying.current = playing;
    setIndex(next);
  };
  return <div className="mushaf-audio-card">
    <audio ref={element} preload="metadata" src={recording.audio} loop={repeat}
      onPlay={() => { useAudio.getState().setTrack(null); setPlaying(true); setError(""); }}
      onPlaying={() => setLoading(false)} onWaiting={() => setLoading(true)} onCanPlay={() => setLoading(false)}
      onPause={() => { setPlaying(false); setLoading(false); }}
      onLoadedMetadata={() => setDuration(Number.isFinite(element.current?.duration) ? element.current!.duration : 0)}
      onTimeUpdate={() => setPosition(element.current?.currentTime || 0)}
      onError={() => { setLoading(false); setPlaying(false); setError("تعذر تحميل التسجيل. تحقق من الاتصال وحاول مجددًا."); }}
      onEnded={() => { setPlaying(false); if (index + 1 < recordings.length) { continuePlaying.current = true; setIndex(index + 1); } else continuePlaying.current = false; }} />
    <div className="mushaf-audio-heading">
      <span className="mushaf-audio-icon"><Headphones size={24} strokeWidth={1.5} /></span>
      <div><small>بصوت القارئ</small><strong>{reciter}</strong></div>
      <span className="mushaf-audio-verse" role="status">الآية {recording.numberInSurah.toLocaleString("ar-EG")}</span>
    </div>
    <div className="mushaf-audio-timeline" dir="ltr">
      <input type="range" aria-label="موضع تشغيل الآية" min={0} max={duration || 1} step={0.1} value={Math.min(position, duration || 1)} disabled={!duration} onChange={(event) => { const value = Number(event.target.value); if (element.current) element.current.currentTime = value; setPosition(value); }} />
      <div><span>{time(position)}</span><span>{time(duration)}</span></div>
    </div>
    <div className="mushaf-audio-controls" dir="ltr">
      <button aria-label="الآية السابقة" disabled={index === 0} onClick={() => move(index - 1)}><SkipBack size={22} /></button>
      <button className="mushaf-audio-play" aria-label={playing ? "إيقاف مؤقت" : "تشغيل التلاوة"} onClick={() => { if (playing || loading) { continuePlaying.current = false; element.current?.pause(); setLoading(false); } else play(); }}>
        {loading ? <LoaderCircle size={27} className="mushaf-audio-spinner" /> : playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
      </button>
      <button aria-label="الآية التالية" disabled={index === recordings.length - 1} onClick={() => move(index + 1)}><SkipForward size={22} /></button>
    </div>
    <div className="mushaf-audio-bottom"><button aria-label="تكرار الآية الحالية" aria-pressed={repeat} onClick={() => setRepeat(!repeat)}><Repeat size={17} /> تكرار الآية</button><span>{loading ? "جارٍ التحميل…" : recordings.length > 1 ? `${index + 1} / ${recordings.length} آية` : "تلاوة آية واحدة"}</span></div>
    {error && <p className="mushaf-audio-error" role="alert">{error} <button onClick={() => { element.current?.load(); play(); }}>إعادة المحاولة</button></p>}
  </div>;
}
