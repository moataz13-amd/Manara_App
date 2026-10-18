import { usePrefs } from "./store";
import { create } from "zustand";
import { createPortal } from "react-dom";
import SurahName from "./surah-name";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Repeat,
  Volume2,
  VolumeX,
  ChevronDown,
  Maximize2,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { useQuran, type Reciter, type Surah } from "./data";
interface Track {
  url: string;
  title: string;
  reciter: string;
  surah: number;
  server: string;
  available: number[];
}
export const useAudio = create<{
  track: Track | null;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  setTrack: (track: Track | null) => void;
}>((set) => ({
  track: null,
  expanded: false,
  setExpanded: (expanded) => set({ expanded }),
  setTrack: (track) => set((state) => state.track?.url === track?.url ? state : {
    track, expanded: track ? (!state.track || state.expanded) : false,
  }),
}));
export function startRecitation(reciter: Reciter, surah: Surah) {
  const recording = reciter.moshaf.find((m) =>
    m.surah_list.split(",").includes(String(surah.number)),
  );
  if (!recording) return;
  useAudio
    .getState()
    .setTrack({
      url: recording.server + String(surah.number).padStart(3, "0") + ".mp3",
      title: surah.name,
      reciter: reciter.name,
      surah: surah.number,
      server: recording.server,
      available: recording.surah_list.split(",").map(Number),
    });
  useAudio.getState().setExpanded(true);
}
export function AudioPlayer() {
  const { track, setTrack, expanded, setExpanded } = useAudio();
  const quran = useQuran();
  const audio = useRef<HTMLAudioElement>(null);
  const playRequest = useRef(0);
  const counted = useRef(false);
  const savedSecond = useRef(-1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState("1");
  const panel = useRef<HTMLDivElement>(null);
  const miniOpen = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!track || !expanded) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("audio-expanded");
    const root = document.getElementById("root");
    const navigation = document.querySelector<HTMLElement>(".mobile-navigation-layer");
    root?.setAttribute("inert", "");
    navigation?.setAttribute("inert", "");
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.classList.remove("audio-expanded");
      root?.removeAttribute("inert");
      navigation?.removeAttribute("inert");
      if (miniOpen.current) miniOpen.current.focus();
      else previous?.focus();
    };
  }, [!!track, expanded]);
  const skip = (delta: number) => {
    if (!track) return;
    const index = track.available.indexOf(track.surah);
    const number = track.available[index + delta];
    if (number)
      setTrack({
        ...track,
        surah: number,
        title:
          quran.data?.find((s) => s.number === number)?.name ||
          `سورة رقم ${number}`,
        url: track.server + String(number).padStart(3, "0") + ".mp3",
      });
  };
  useEffect(() => {
    if (!track) return;
    counted.current = false;
    savedSecond.current = -1;
    setError("");
    setProgress(0);
    setDuration(0);
    setLoading(true);
    const request = ++playRequest.current;
    const element = audio.current;
    element?.play().catch((reason: DOMException) => {
      if (request !== playRequest.current || reason.name === "AbortError") return;
      setPlaying(false);
      setLoading(false);
      setError("اضغط تشغيل لبدء التلاوة");
    });
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.reciter,
        album: "منارة",
      });
      navigator.mediaSession.setActionHandler("play", () => {
        void audio.current?.play();
      });
      navigator.mediaSession.setActionHandler("pause", () =>
        audio.current?.pause(),
      );
    }
    return () => { playRequest.current++; };
  }, [track?.url]);
  if (!track) return null;
  const time = (value: number) => {
    const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const toggle = () => {
    if (playing) audio.current?.pause();
    else audio.current?.play().catch(() => setError("اضغط تشغيل للمحاولة مرة أخرى"));
  };
  const seek = (value: number) => {
    const element = audio.current;
    if (!element || !Number.isFinite(element.duration)) return;
    element.currentTime = Math.max(0, Math.min(element.duration, value));
    setProgress(Math.floor(element.currentTime));
  };
  const close = () => { audio.current?.pause(); setTrack(null); };
  const percent = duration ? Math.min(100, progress / duration * 100) : 0;
  const previousDisabled = track.available.indexOf(track.surah) <= 0;
  const nextDisabled = track.available.indexOf(track.surah) >= track.available.length - 1;
  return createPortal(
    <div className="recitation-player-root">
      <audio
        ref={audio}
        src={track.url}
        preload="auto"
        loop={repeat}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          if (audio.current) usePrefs.getState().set({ playback: { surah: track.surah, reciter: track.reciter, position: audio.current.currentTime } });
        }}
        onTimeUpdate={() => {
          const position = audio.current?.currentTime || 0;
          setProgress(Math.floor(position));
          if (position >= 10 && !counted.current) {
            counted.current = true;
            usePrefs.getState().recordListening(track.surah, track.reciter);
          }
          const interval = Math.floor(position / 5);
          if (interval !== savedSecond.current) {
            savedSecond.current = interval;
            usePrefs.getState().set({ playback: { surah: track.surah, reciter: track.reciter, position } });
          }
        }}
        onLoadedMetadata={() => {
          const element = audio.current;
          if (!element) return;
          setDuration(Number.isFinite(element.duration) ? element.duration : 0);
          const saved = usePrefs.getState().playback;
          if (saved?.surah === track.surah && saved.reciter === track.reciter && saved.position > 0 && saved.position < element.duration - 2) element.currentTime = saved.position;
        }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => { setLoading(false); setPlaying(true); setError(""); }}
        onEnded={() => {
          if (!counted.current) usePrefs.getState().recordListening(track.surah, track.reciter);
          counted.current = true;
          usePrefs.getState().set({ playback: null });
          setPlaying(false);
          if (!repeat) skip(1);
        }}
        onError={() => {
          setError("التسجيل غير متاح الآن. اختر تسجيلًا آخر.");
          setLoading(false);
        }}
      />
      {expanded ? <div className="recitation-screen" role="dialog" aria-modal="true" aria-label="مشغل تلاوات القرآن" ref={panel}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setExpanded(false); return; }
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)'));
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
        <div className="recitation-sheet">
          <header className="recitation-topbar">
            <button aria-label="تصغير المشغل" onClick={() => setExpanded(false)}><ChevronDown size={25} /></button>
            <div><span>منارة</span><h1>تلاوة القرآن الكريم</h1></div>
            <button aria-label="إيقاف وإغلاق المشغل" onClick={close}><X size={21} /></button>
          </header>
          <div className="recitation-artwork patterned">
            <span className="recitation-artwork-label">القرآن الكريم</span>
            <h2><SurahName number={track.surah} name={track.title} /></h2>
            <span className="recitation-artwork-ornament" aria-hidden="true">۞</span>
          </div>
          <div className="recitation-description"><h3>{track.reciter}</h3><p role={error ? "status" : undefined}>{error || "تلاوة تملأ قلبك سكينة"}</p></div>
          <div className="recitation-timeline" dir="ltr">
            <input type="range" aria-label="موضع التشغيل" min="0" max={duration || 1} step="1" value={Math.min(progress, duration || 0)} disabled={!duration} onChange={(event) => seek(Number(event.target.value))} />
            <div><time>{time(progress)}</time><time>−{time(duration - progress)}</time></div>
          </div>
          <div className="recitation-controls" dir="ltr">
            <button aria-label="السورة السابقة" disabled={previousDisabled} onClick={() => skip(-1)}><SkipBack size={27} fill="currentColor" /></button>
            <button aria-label="الرجوع عشر ثوان" disabled={!duration} onClick={() => seek(progress - 10)} className="recitation-jump"><RotateCcw size={25} /><small>10</small></button>
            <button className="recitation-play" aria-label={playing ? "إيقاف مؤقت" : "تشغيل"} aria-busy={loading} onClick={toggle}>{playing ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}</button>
            <button aria-label="التقديم عشر ثوان" disabled={!duration} onClick={() => seek(progress + 10)} className="recitation-jump"><RotateCw size={25} /><small>10</small></button>
            <button aria-label="السورة التالية" disabled={nextDisabled} onClick={() => skip(1)}><SkipForward size={27} fill="currentColor" /></button>
          </div>
          <div className="recitation-options">
            <button aria-label="تكرار السورة" aria-pressed={repeat} onClick={() => setRepeat(!repeat)} className={repeat ? "active" : ""}><Repeat size={20} /></button>
            <label><span>سرعة التشغيل</span><select aria-label="سرعة التشغيل" value={speed} onChange={(event) => { setSpeed(event.target.value); if (audio.current) audio.current.playbackRate = Number(event.target.value); }}>{["0.75", "1", "1.25", "1.5"].map((value) => <option key={value} value={value}>{value}×</option>)}</select></label>
          </div>
          <label className="recitation-volume" dir="ltr"><VolumeX size={20} /><span className="sr-only">مستوى الصوت</span><input aria-label="الصوت" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); if (audio.current) audio.current.volume = value; }} /><Volume2 size={22} /></label>
        </div>
      </div> : <section className="recitation-mini" aria-label="مشغل التلاوة المصغر">
        <div className="recitation-mini-progress" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
        <button className="recitation-mini-open" aria-label={`فتح مشغل ${track.title}`} onClick={() => setExpanded(true)} ref={miniOpen}>
          <span className="recitation-mini-art" aria-hidden="true">۞</span><span><b><SurahName number={track.surah} name={track.title} /></b><small>{track.reciter}</small></span><Maximize2 size={17} />
        </button>
        <button className="recitation-mini-toggle" aria-label={playing ? "إيقاف مؤقت" : "تشغيل"} aria-busy={loading} onClick={toggle}>{playing ? <Pause size={21} /> : <Play size={21} />}</button>
        <button aria-label="إيقاف وإغلاق المشغل" onClick={close}><X size={19} /></button>
      </section>}
    </div>, document.body,
  );
}
