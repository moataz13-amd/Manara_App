import { create } from "zustand";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Repeat,
  Volume2,
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
  setTrack: (track: Track | null) => void;
}>((set) => ({ track: null, setTrack: (track) => set({ track }) }));
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
}
export function AudioPlayer() {
  const { track, setTrack } = useAudio();
  const quran = useQuran();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setError("");
    setProgress(0);
    setDuration(0);
    setLoading(true);
    audio.current?.play().catch(() => {
      setPlaying(false);
      setLoading(false);
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
  }, [track]);
  if (!track) return null;
  const time = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return (
    <div className="audio-player">
      <audio
        ref={audio}
        src={track.url}
        loop={repeat}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setProgress(audio.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audio.current?.duration || 0)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onEnded={() => {
          setPlaying(false);
          if (!repeat) skip(1);
        }}
        onError={() => {
          setError("التسجيل غير متاح الآن. اختر تسجيلًا آخر.");
          setLoading(false);
        }}
      />
      <div className="track-info">
        <span className="audio-art">۞</span>
        <div>
          <b>{track.title}</b>
          <small>
            {error || track.reciter}
            {loading && !error ? " · جارٍ التحميل" : ""}
          </small>
        </div>
      </div>
      <div className="play-controls">
        <button
          aria-label="السورة السابقة"
          onClick={() => skip(-1)}
          disabled={track.available.indexOf(track.surah) === 0}
        >
          <SkipForward size={19} />
        </button>
        <button
          className="play-button"
          aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
          onClick={() =>
            playing
              ? audio.current?.pause()
              : audio.current
                  ?.play()
                  .catch(() => setError("اضغط تشغيل للمحاولة مرة أخرى"))
          }
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          aria-label="السورة التالية"
          onClick={() => skip(1)}
          disabled={
            track.available.indexOf(track.surah) === track.available.length - 1
          }
        >
          <SkipBack size={19} />
        </button>
      </div>
      <div className="seek">
        <input
          aria-label="موضع التشغيل"
          type="range"
          min="0"
          max={duration || 1}
          value={progress}
          onChange={(e) => {
            if (audio.current)
              audio.current.currentTime = Number(e.target.value);
          }}
        />
        <small dir="ltr">
          {time(progress)} / {time(duration)}
        </small>
      </div>
      <button
        className={repeat ? "selected" : ""}
        aria-label="تكرار السورة"
        aria-pressed={repeat}
        onClick={() => setRepeat(!repeat)}
      >
        <Repeat size={19} />
      </button>
      <select
        aria-label="سرعة التشغيل"
        defaultValue="1"
        onChange={(e) => {
          if (audio.current)
            audio.current.playbackRate = Number(e.target.value);
        }}
      >
        <option value="0.75">0.75×</option>
        <option value="1">1×</option>
        <option value="1.25">1.25×</option>
        <option value="1.5">1.5×</option>
      </select>
      <label className="volume">
        <Volume2 size={18} />
        <input
          aria-label="الصوت"
          type="range"
          min="0"
          max="1"
          step="0.05"
          defaultValue="1"
          onChange={(e) => {
            if (audio.current) audio.current.volume = Number(e.target.value);
          }}
        />
      </label>
      <button aria-label="إغلاق المشغل" onClick={() => setTrack(null)}>
        <X size={18} />
      </button>
    </div>
  );
}
