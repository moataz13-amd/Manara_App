import { useLayoutEffect, useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { type Surah } from "./data";
import { usePrefs } from "./store";
import { Logo } from "./ui";
import { pageGroups, splitOpening } from "./mushaf";

export default function Reader({
  surahs,
  surah,
}: {
  surahs: Surah[];
  surah: Surah;
}) {
  const prefs = usePrefs();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const target = Number(location.hash.match(/^#ayah-(\d+)$/)?.[1] || 1);
  const requested = Number(params.get("page"));
  const page =
    Number.isInteger(requested) && requested >= 1 && requested <= 604
      ? requested
      : surah.ayahs.find((a) => a.numberInSurah === target)?.page ||
        surah.ayahs[0].page;
  const groups = pageGroups(surahs, page);
  const first = groups[0];
  const basmala = surahs[0].ayahs[0].text.replace(/^\uFEFF/, "");
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [navigationVisible, setNavigationVisible] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    time: number;
    dx: number;
    dragging: boolean;
  } | null>(null);
  const busy = useRef(false);
  const suppressClickUntil = useRef(0);
  const incoming = useRef(0);
  const animation = useRef<Animation | null>(null);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const settle = async (destination: number) => {
    if (!sheet.current) return;
    busy.current = true;
    const from = sheet.current.style.transform || "translateX(0px)";
    const motion = sheet.current.animate(
      [{ transform: from }, { transform: `translateX(${destination}px)` }],
      {
        duration: reducedMotion() ? 0 : 230,
        easing: "cubic-bezier(.22,.7,.25,1)",
        fill: "forwards",
      },
    );
    animation.current = motion;
    try {
      await motion.finished;
      return true;
    } catch {
      return false;
    }
  };
  const cancelDrag = () => {
    gesture.current = null;
    setDragging(false);
    void settle(0).then(() => {
      if (sheet.current) sheet.current.style.transform = "";
      animation.current?.cancel();
      busy.current = false;
    });
  };
  useLayoutEffect(() => {
    animation.current?.cancel();
    busy.current = false;
    if (sheet.current) {
      sheet.current.style.transform = "";
      if (incoming.current && !reducedMotion()) {
        animation.current = sheet.current.animate(
          [
            { transform: `translateX(${incoming.current}px)` },
            { transform: "translateX(0px)" },
          ],
          { duration: 260, easing: "cubic-bezier(.22,.7,.25,1)" },
        );
      }
    }
    incoming.current = 0;
    return () => {
      animation.current?.cancel();
      gesture.current = null;
    };
  }, [page]);
  const current = groups
    .flatMap((g) => g.ayahs.map((a) => ({ ayah: a, surah: g.surah })))
    .find(
      ({ ayah, surah: s }) => `${s.number}:${ayah.numberInSurah}` === selected,
    );
  const go = (next: number) => {
    if (next < 1 || next > 604) return;
    const group = pageGroups(surahs, next)[0];
    prefs.set({
      last: { surah: group.surah.number, ayah: group.ayahs[0].numberInSurah },
    });
    navigate(`/quran/${group.surah.number}?page=${next}`);
  };
  useEffect(() => {
    setNavigationVisible(false);
    setSelected(null);
    setCopied(false);
  }, [page, location.hash]);
  useEffect(() => {
    document.body.classList.add("reading-mushaf");
    return () => document.body.classList.remove("reading-mushaf", "mushaf-navigation-visible");
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        (e.target instanceof HTMLElement &&
          (e.target.closest("input,select,textarea") ||
            e.target.isContentEditable))
      )
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(page + 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(page - 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [page, surahs]);
  useLayoutEffect(() => {
    let active = true;
    const fit = () => {
      if (!active || !frame.current || !content.current) return;
      const el = content.current;
      let low = 8,
        high = Math.min(frame.current.clientWidth / 12.5, prefs.fontSize * 1.4);
      // Fit the verified page to the available viewport; never clip its final ayahs.
      for (let i = 0; i < 12; i++) {
        const mid = (low + high) / 2;
        el.style.fontSize = `${mid}px`;
        if (
          el.scrollHeight <= frame.current.clientHeight &&
          el.scrollWidth <= frame.current.clientWidth
        )
          low = mid;
        else high = mid;
      }
      el.style.fontSize = `${Math.floor(low * 100) / 100}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (frame.current) observer.observe(frame.current);
    document.fonts.ready.then(fit);
    document.fonts.addEventListener("loadingdone", fit);
    void Promise.all([
      document.fonts.load('30px "Manara Uthmanic Hafs"'),
      document.fonts.load('30px "Manara Surah"'),
      document.fonts.load('24px "Manara Juz"'),
    ])
      .then(fit)
      .catch(() => {});
    return () => {
      active = false;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", fit);
    };
  }, [page, prefs.fontSize]);
  useEffect(() => {
    document.body.classList.toggle("mushaf-navigation-visible", navigationVisible);
    return () => document.body.classList.remove("mushaf-navigation-visible");
  }, [navigationVisible]);
  const number = (a: (typeof first.ayahs)[number], s: Surah) => (
    <button
      className={`verse-number ${prefs.last.surah === s.number && prefs.last.ayah === a.numberInSurah ? "current" : ""}`}
      aria-label={`${s.name}، الآية ${a.numberInSurah}`}
      aria-pressed={selected === `${s.number}:${a.numberInSurah}`}
      onClick={() => {
        setSelected(`${s.number}:${a.numberInSurah}`);
        setCopied(false);
        prefs.set({ last: { surah: s.number, ayah: a.numberInSurah } });
      }}
    >
      {a.numberInSurah.toLocaleString("ar-EG")}
    </button>
  );
  return (
    <div className={`reader paged-reader ${page <= 2 ? "opening-page" : ""}`}>
      <header className="reader-toolbar mushaf-header">
        <div className="mushaf-header-right">
          <Link
            to="/quran"
            className="mushaf-header-surah mushaf-surah-name"
            aria-label={`${first.surah.name}، افتح فهرس السور`}
            dir="ltr"
          >
            {String(first.surah.number).padStart(3, "0")}
          </Link>
          <Link to="/quran?search=1" className="mushaf-header-search" aria-label="بحث في القرآن">
            <Search size={19} />
          </Link>
        </div>
        <Logo />
        <div className="mushaf-header-left">
          <span className="mushaf-header-juz mushaf-juz-name" dir="ltr" aria-label={`الجزء ${first.ayahs[0].juz}`}>
            {String(first.ayahs[0].juz)}
          </span>
          <button
            className="mushaf-header-bookmark"
            aria-label="حفظ علامة في الصفحة الحالية"
            aria-pressed={prefs.bookmarks.includes(`${first.surah.number}:${first.ayahs[0].numberInSurah}`)}
            onClick={() => prefs.toggleBookmark(`${first.surah.number}:${first.ayahs[0].numberInSurah}`)}
          >
            <Bookmark size={30} strokeWidth={1.25} fill={prefs.bookmarks.includes(`${first.surah.number}:${first.ayahs[0].numberInSurah}`) ? "currentColor" : "var(--mint)"} />
          </button>
        </div>
      </header>
      <div
        className="mushaf-page-frame"
        ref={frame}
        tabIndex={0}
        role="region"
        aria-label="صفحة المصحف، اسحب يمينًا أو يسارًا للتقليب، أو استخدم أسهم لوحة المفاتيح"
        onClick={(e) => {
          if (Date.now() < suppressClickUntil.current) return;
          if ((e.target as HTMLElement).closest("button, a")) return;
          setNavigationVisible((visible) => !visible);
        }}
        onClickCapture={(e) => {
          if (Date.now() < suppressClickUntil.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onPointerDown={(e) => {
          if (!e.isPrimary) {
            if (gesture.current) cancelDrag();
            return;
          }
          if (e.button !== 0 || busy.current) return;
          animation.current?.cancel();
          gesture.current = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            time: performance.now(),
            dx: 0,
            dragging: false,
          };
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g || g.id !== e.pointerId || !sheet.current) return;
          const dx = e.clientX - g.x,
            dy = e.clientY - g.y;
          if (!g.dragging) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
              gesture.current = null;
              return;
            }
            if (Math.abs(dx) < 7) return;
            g.dragging = true;
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          g.dx = dx;
          const blocked = (page === 604 && dx > 0) || (page === 1 && dx < 0);
          sheet.current.style.transform = `translateX(${blocked ? dx * 0.18 : dx}px)`;
        }}
        onPointerUp={async (e) => {
          const g = gesture.current;
          if (!g || g.id !== e.pointerId) return;
          gesture.current = null;
          setDragging(false);
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
          if (!g.dragging) return;
          suppressClickUntil.current = Date.now() + 500;
          const width = frame.current?.clientWidth || 350;
          const next = page + (g.dx > 0 ? 1 : -1);
          const velocity =
            Math.abs(g.dx) / Math.max(1, performance.now() - g.time);
          const commit =
            (Math.abs(g.dx) > width * 0.22 ||
              (Math.abs(g.dx) > 45 && velocity > 0.45)) &&
            next >= 1 &&
            next <= 604;
          if (commit) {
            const direction = g.dx > 0 ? 1 : -1;
            if (await settle(direction * width)) {
              incoming.current = -direction * width;
              go(next);
            }
          } else cancelDrag();
        }}
        onPointerCancel={() => {
          if (gesture.current) cancelDrag();
        }}
        onLostPointerCapture={() => {
          if (gesture.current) cancelDrag();
        }}
      >
        <div
          ref={sheet}
          className={`mushaf-page-sheet ${dragging ? "is-dragging" : ""}`}
        >
          <div className="mushaf-page-text" ref={content} key={page}>
            {groups.map(({ surah: s, ayahs }) => (
              <section className="mushaf-surah" key={s.number}>
                {ayahs[0].numberInSurah === 1 && (
                  <div className="mushaf-surah-heading supplied-surah-frame">
                    <img
                      src="/images/surah-frame.svg"
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                    />
                    <h1
                      className="mushaf-surah-name"
                      aria-label={s.name}
                      dir="ltr"
                    >
                      {String(s.number).padStart(3, "0")}
                    </h1>
                    <span className="frame-juz">
                      <span>الجزء</span>
                      <b>{ayahs[0].juz.toLocaleString("ar-EG")}</b>
                    </span>
                    <span className="frame-surah-order">
                      <span>ترتيبها</span><b>{s.number.toLocaleString("ar-EG")}</b>
                    </span>
                  </div>
                )}
                {ayahs.map((a) => {
                  const sourceOpening = splitOpening(s.number, a, basmala);
                  // Match the display encoding to the supplied Hafs font.
                  const opening = {
                    basmala: sourceOpening.basmala,
                    text: s.number === 1 && a.numberInSurah === 1
                      ? ""
                      : a.displayText ?? sourceOpening.text,
                  };
                  const endingStart = opening.text.lastIndexOf(" ") + 1;
                  return (
                    <span
                      className="mushaf-verse"
                      key={a.number}
                      id={`ayah-${s.number}-${a.numberInSurah}`}
                    >
                      {opening.basmala && (
                        <span className="mushaf-basmala">
                          <span
                            className="basmala-artwork"
                            role="img"
                            aria-label={opening.basmala}
                          />
                          {s.number === 1 && number(a, s)}
                        </span>
                      )}
                      {opening.text && (
                        <>
                          <span>{opening.text.slice(0, endingStart)}</span>
                          <span className="mushaf-ayah-ending">
                            {opening.text.slice(endingStart)}
                            {number(a, s)}
                          </span>
                          {a !== ayahs[ayahs.length - 1] ? " " : null}
                        </>
                      )}
                    </span>
                  );
                })}
              </section>
            ))}
          </div>
        </div>
      </div>
      <div className={`mushaf-verse-tools ${current ? "has-selection" : ""}`}>
        {current ? (
          <>
            <span>الآية {current.ayah.numberInSurah}</span>
            <button
              aria-label="علامة مرجعية للآية المحددة"
              aria-pressed={prefs.bookmarks.includes(selected!)}
              onClick={() => prefs.toggleBookmark(selected!)}
            >
              <Bookmark
                size={16}
                fill={
                  prefs.bookmarks.includes(selected!) ? "currentColor" : "none"
                }
              />
            </button>
            <button
              aria-label="نسخ الآية المحددة"
              onClick={() =>
                navigator.clipboard
                  .writeText(current.ayah.text)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false))
              }
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </>
        ) : (
          <span>اضغط على رقم الآية للحفظ أو النسخ</span>
        )}
      </div>
      <footer className="mushaf-pagination mushaf-page-indicator">
        <span role="status" aria-live="polite">
          {page.toLocaleString("ar-EG")}
        </span>
      </footer>
    </div>
  );
}
