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
import ShareVerses from "./share-verses";
import { Share2 } from "lucide-react";
import { VerseDialog, type VerseView } from "./verse-dialog";

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
  const [verseView, setVerseView] = useState<VerseView | null>(null);
  const [sharing, setSharing] = useState<{ surah: Surah; initial: number } | null>(null);
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
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearLongPress = () => {
    if (longPress.current !== null) clearTimeout(longPress.current);
    longPress.current = null;
  };
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
    clearLongPress();
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
      clearLongPress();
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
    setSelected(null);
    setVerseView(null);
    setCopied(false);
  }, [page, location.hash]);
  useEffect(() => {
    document.body.classList.add("reading-mushaf");
    return () => document.body.classList.remove("reading-mushaf", "mushaf-navigation-visible");
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
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
      // Start each measurement from the Mushaf's base leading.  A prior page may
      // have expanded its line spacing, and retaining that inline value makes the
      // next page appear unchanged or forces an unnecessarily small font.
      el.style.lineHeight = "";
      const contentBounds = () => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = Array.from(range.getClientRects()).filter(
          (rect) => rect.width > 0 && rect.height > 0,
        );
        if (!rects.length) return { height: 0, width: 0, lineCount: 0 };
        const top = Math.min(...rects.map((rect) => rect.top));
        const bottom = Math.max(...rects.map((rect) => rect.bottom));
        const left = Math.min(...rects.map((rect) => rect.left));
        const right = Math.max(...rects.map((rect) => rect.right));
        return {
          height: bottom - top,
          width: right - left,
          lineCount: new Set(rects.map((rect) => Math.round(rect.top))).size,
        };
      };
      const hasOrphanLastAyah = () => {
        const verses = Array.from(el.querySelectorAll<HTMLElement>(".mushaf-verse"));
        const lastVerse = verses.at(-1);
        if (!lastVerse) return false;

        const allRects = verses.flatMap((verse) =>
          Array.from(verse.getClientRects()).filter(
            (rect) => rect.width > 0 && rect.height > 0,
          ),
        );
        if (!allRects.length) return false;
        const lastLineTop = Math.max(...allRects.map((rect) => Math.round(rect.top)));
        const lastLineRects = allRects.filter(
          (rect) => Math.abs(Math.round(rect.top) - lastLineTop) <= 1,
        );
        const lastLineVerses = new Set(
          verses
            .filter((verse) =>
              Array.from(verse.getClientRects()).some(
                (rect) => Math.abs(Math.round(rect.top) - lastLineTop) <= 1,
              ),
            )
            .map((verse) => verse.dataset.verseKey),
        );

        // Only correct a genuinely isolated short ayah. A final line that is
        // full (or shared with another ayah) is a valid Mushaf line.
        return (
          lastLineVerses.size === 1 &&
          lastLineRects.reduce((width, rect) => width + rect.width, 0) <
            el.clientWidth * 0.68
        );
      };
      let low = 8,
        high = Math.min(frame.current.clientWidth / 5, prefs.fontSize * 2);
      const availableHeight = frame.current.clientHeight - 16;
      // Measure rendered Quran lines, not the flex item which already fills the page.
      for (let i = 0; i < 18; i++) {
        const mid = (low + high) / 2;
        el.style.fontSize = `${mid}px`;
        const bounds = contentBounds();
        if (
          bounds.height + 12 <= availableHeight &&
          el.scrollWidth <= frame.current.clientWidth
        )
          low = mid;
        else high = mid;
      }
      let currentSize = Math.floor(low * 100) / 100;
      el.style.fontSize = `${currentSize}px`;
      // Prevent a very short final ayah from becoming a lone final line. This
      // is deliberately a small adjustment: it preserves the supplied Hafs
      // glyphs and page content, only allowing the preceding line to absorb it.
      if (page > 2 && hasOrphanLastAyah()) {
        const smallest = currentSize * 0.88;
        for (
          let candidate = currentSize - 0.1;
          candidate >= smallest;
          candidate -= 0.1
        ) {
          el.style.fontSize = `${candidate}px`;
          const bounds = contentBounds();
          if (
            !hasOrphanLastAyah() &&
            bounds.height + 12 <= availableHeight &&
            el.scrollWidth <= frame.current.clientWidth
          ) {
            currentSize = Math.floor(candidate * 100) / 100;
            break;
          }
        }
        el.style.fontSize = `${currentSize}px`;
      }
      const metrics = contentBounds();
      if (page > 2 && metrics.lineCount > 1) {
        const freeSpace = Math.max(0, availableHeight - metrics.height - 4);
        const expandedLineHeight =
          1.85 + freeSpace / ((metrics.lineCount - 1) * currentSize);
        el.style.lineHeight = String(Math.min(2.2, expandedLineHeight));
      }

      // If the last ayah/word wrapped onto a line by itself, shrink the font size
      // slightly so it pulls up into the previous line to form a complete line.
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
  }, [page, prefs.fontSize, navigationVisible]);
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
        setVerseView("actions");
        setSelected(`${s.number}:${a.numberInSurah}`);
        setCopied(false);
        prefs.set({ last: { surah: s.number, ayah: a.numberInSurah } });
      }}
>{a.numberInSurah.toLocaleString("ar-EG")}</button>
  );
  return (
    <div className={`reader paged-reader ${page <= 2 ? "opening-page" : ""} ${navigationVisible ? "" : "mushaf-focus-mode"}`}>
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
          clearLongPress();
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
          const verse = (e.target as HTMLElement).closest<HTMLElement>("[data-verse-key]");
          if (verse) {
            const [surahNumber, ayahNumber] = verse.dataset.verseKey!.split(":").map(Number);
            const verseSurah = surahs.find((s) => s.number === surahNumber);
            if (verseSurah) longPress.current = setTimeout(() => {
              longPress.current = null;
              gesture.current = null;
              suppressClickUntil.current = Date.now() + 800;
              setSelected(`${surahNumber}:${ayahNumber}`);
              setCopied(false);
              prefs.set({ last: { surah: surahNumber, ayah: ayahNumber } });
              setVerseView("actions");
            }, 550);
          }
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g || g.id !== e.pointerId || !sheet.current) return;
          const dx = e.clientX - g.x,
            dy = e.clientY - g.y;
          if (Math.hypot(dx, dy) > 7) clearLongPress();
          if (!g.dragging) {
            if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx) * 1.5) {
              gesture.current = null;
              return;
            }
            if (Math.abs(dx) < 7) return;
            g.dragging = true;
            setDragging(true);
            if (!e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.setPointerCapture(e.pointerId);
          }
          if (e.cancelable) e.preventDefault();
          g.dx = dx;
          const blocked = (page === 604 && dx > 0) || (page === 1 && dx < 0);
          sheet.current.style.transform = `translateX(${blocked ? dx * 0.18 : dx}px)`;
        }}
        onPointerUp={async (e) => {
          clearLongPress();
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
            (Math.abs(g.dx) > Math.min(65, width * 0.18) ||
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
          clearLongPress();
          if (gesture.current) cancelDrag();
        }}
        onLostPointerCapture={(e) => {
          // Touch devices initially capture the child under the finger. Its
          // lost-capture event bubbles when capture moves to this frame.
          if (e.target === e.currentTarget && gesture.current &&
              !e.currentTarget.hasPointerCapture(e.pointerId)) cancelDrag();
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
                      className={`mushaf-verse ${selected === `${s.number}:${a.numberInSurah}` ? "verse-selected" : ""}`}
                      data-verse-key={`${s.number}:${a.numberInSurah}`}
                      onContextMenu={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (Date.now() < suppressClickUntil.current || (event.target as HTMLElement).closest("button")) return;
                        setSelected(`${s.number}:${a.numberInSurah}`);
                        setVerseView("actions");
                        setCopied(false);
                        prefs.set({ last: { surah: s.number, ayah: a.numberInSurah } });
                      }}
                      key={a.number}
                      id={`ayah-${s.number}-${a.numberInSurah}`}
                    >
                      {opening.basmala && (
                        <span className="mushaf-basmala">
                          <span
                            className="basmala-artwork"
                            role="img"
                            aria-label={opening.basmala}
                          />{s.number === 1 && number(a, s)}
                        </span>
                      )}
                      {opening.text && (
                        <>
                          <span>{opening.text.slice(0, endingStart)}</span>
                          <span className="mushaf-ayah-ending">{opening.text.slice(endingStart)}{number(a, s)}</span>{a !== ayahs[ayahs.length - 1] ? " " : null}
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
            <button aria-label="مشاركة الآية أو مجموعة آيات" onClick={() => setSharing({ surah: current.surah, initial: current.ayah.numberInSurah })}><Share2 size={18} /></button>
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
          <span>اضغط على الآية للمشاركة أو التفسير أو القراءة الصوتية</span>
        )}
      </div>
      <footer className="mushaf-pagination mushaf-page-indicator">
        <span role="status" aria-live="polite">
          {page.toLocaleString("ar-EG")}
        </span>
      </footer>
      {sharing && <ShareVerses {...sharing} onClose={() => setSharing(null)} />}
      {current && verseView && <VerseDialog surahs={surahs} initialSurah={current.surah.number} initialAyah={current.ayah.numberInSurah} initialView={verseView} onClose={() => setVerseView(null)} onShare={(s, a) => { setVerseView(null); setSharing({ surah: s, initial: a }); }} />}
    </div>
  );
}
