import { useState, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpLeft,
  Bookmark,
  BookOpen,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  CloudSun,
  MapPin,
  Headphones,
  Play,
  ChevronLeft,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Section, Status } from "./ui";
import { usePrefs } from "./store";
import { usePrayer } from "./prayer";
import { useQuran, useReciters, useAdhkar } from "./data";
import { startRecitation } from "./audio";
function CardCarousel({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  return <div className={`draggable-cards ${className}`} aria-label={label} tabIndex={0}
    onDragStart={(e) => e.preventDefault()}
    onPointerDown={(e) => {
      suppressClick.current = false;
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag.current = { x: e.clientX, scroll: e.currentTarget.scrollLeft, moved: false };
    }}
    onPointerMove={(e) => {
      const state = drag.current;
      if (!state) return;
      const dx = e.clientX - state.x;
      if (!state.moved && Math.abs(dx) < 6) return;
      state.moved = true;
      suppressClick.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("is-dragging");
      e.currentTarget.scrollLeft = state.scroll - dx;
    }}
    onPointerUp={(e) => {
      drag.current = null;
      e.currentTarget.classList.remove("is-dragging");
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }}
    onPointerCancel={(e) => { drag.current = null; e.currentTarget.classList.remove("is-dragging"); }}
    onClickCapture={(e) => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}
  >{children}</div>;
}
const portraits: Record<number, string> = {
  112: "/images/minshawi.jpg",
  123: "/images/alafasy.jpg",
  54: "/images/sudais.jpg",
  92: "/images/dosari.jpg",
};
export const prayerIcons = [Sunrise, Sunrise, Sun, CloudSun, Sunset, Moon];
export function PrayerCard() {
  const { place } = usePrefs();
  const { rows, next, countdown, format } = usePrayer();
  return (
    <div className="prayer-card">
      <div className="prayer-top">
        <div>
          <span>{next ? "الصلاة القادمة" : "حان وقت السكينة"}</span>
          <h2>{next ? `صلاة ${next.name}` : "صلاتك، نور يومك"}</h2>
          <small>
            {place ? (
              <>
                <MapPin size={13} />
                {place.name}
              </>
            ) : (
              "مواقيت دقيقة بحسب موقعك"
            )}
          </small>
        </div>
        <div className="countdown">
          <span>
            {next ? "المتبقي على الأذان" : "وَأَقِمِ الصَّلَاةَ لِذِكْرِي"}
          </span>
          {next ? (
            <b dir="ltr">{countdown}</b>
          ) : (
            <Link to="/prayers" className="location-button">
              <MapPin size={16} /> اختر موقعك
            </Link>
          )}
        </div>
      </div>
      {place ? (
        <div className="prayer-strip">
          {rows.map((p, i) => {
            const Icon = prayerIcons[i];
            return (
              <div key={p.key} className={next?.key === p.key ? "next" : ""}>
                <span>{p.name}</span>
                <Icon strokeWidth={1} size={35} />
                <b>{format(p.time)}</b>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="prayer-strip unconfigured">
          {Object.values([
            "الفجر",
            "الشروق",
            "الظهر",
            "العصر",
            "المغرب",
            "العشاء",
          ]).map((name, i) => {
            const Icon = prayerIcons[i];
            return (
              <div key={name}>
                <span>{name}</span>
                <Icon strokeWidth={1} size={35} />
                <b>—</b>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default function Home() {
  const quran = useQuran();
  const reciters = useReciters();
  const adhkar = useAdhkar();
  const { last, bookmarks, toggleBookmark } = usePrefs();
  const [selectionOffset, setSelectionOffset] = useState(0);
  const surah = quran.data?.find((s) => s.number === last.surah);
  const featured = [112, 54, 123, 92].flatMap(
    (id) => reciters.data?.find((r) => r.id === id) || [],
  );
  const dhikrCategories = [...new Set(adhkar.data?.map((row) => row[0]) || ["أذكار المساء", "أذكار الصباح", "أذكار النوم"])];
  return (
    <>
      <div className="home-intro">
        <div>
          <span className="eyebrow">
            السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ
          </span>
          <h1>
            كل يوم، أقرب إلى الله<span> ✧</span>
          </h1>
          <p>قليلٌ دائم، وأثرٌ يبقى في قلبك.</p>
        </div>
        <div className="date-stamp">
          <span>
            {new Intl.DateTimeFormat("ar-EG-u-ca-islamic", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </span>
          <small>
            {new Intl.DateTimeFormat("ar-EG", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </small>
        </div>
      </div>
      <div className="home-top-grid">
        <PrayerCard />
        <div className="continue-wrap">
          <div className="section-heading">
            <h2>كمّل قراءتك</h2>
            <Link to="/quran">
              المصحف <ChevronLeft size={15} />
            </Link>
          </div>
          <Link
            to={`/quran/${last.surah}#ayah-${last.ayah}`}
            className="continue-card patterned"
          >
            <Bookmark className="ribbon" fill="currentColor" />
            <h2
              className="surah-calligraphy"
              dir="ltr"
              aria-label={surah?.name || `سورة رقم ${last.surah}`}
            >
              {String(last.surah).padStart(3, "0")}
            </h2>
            <small>
              {surah
                ? `${surah.ayahs.length} آية · ${surah.revelationType === "Meccan" ? "مكية" : "مدنية"} · الآية ${last.ayah}`
                : "استكمل وردك اليومي"}
            </small>
          </Link>
        </div>
      </div>
      <Section title="القرّاء" to="/reciters">
        <CardCarousel className="reciter-grid horizontal-reciter-strip" label="القراء والتلاوات">
          {reciters.isPending ? (
            <Status />
          ) : (
            featured.map((r, i) => (
              <Link
                to={`/reciters?reciter=${r.id}`}
                className={`reciter-card reciter-${i}`}
                key={r.id}
              >
                <div className="reciter-arch">
                  <img
                    className="reciter-photo"
                    src={portraits[r.id]}
                    alt={r.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span>{r.name.split(" ").slice(0, 2).join(" ")}</span>
                  <Headphones size={28} strokeWidth={1} />
                </div>
                <div className="reciter-caption">
                  <div>
                    <small>الشيخ</small>
                    <h3>{r.name}</h3>
                  </div>
                  <span className="round-play">
                    <Play size={15} fill="currentColor" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </CardCarousel>
      </Section>
      <div className="home-bottom-grid">
        <Section title="مختارات من القرآن" to="/quran">
          <CardCarousel className="selection-carousel" label="مختارات التلاوات">
            {[12, 18, 36].map((base) => {
              const number = ((base - 1 + selectionOffset + 114) % 114) + 1;
              const selectedSurah = quran.data?.[number - 1];
              const bookmark = `${number}:1`;
              return (
                <article className="selection-card patterned" key={base}>
                  <Link to={`/quran/${number}`} aria-label={selectedSurah?.name || `سورة ${number}`}>
                    <h2 className="surah-calligraphy" dir="ltr">{String(number).padStart(3, "0")}</h2>
                  </Link>
                  <p>{featured[0]?.name || "تلاوة القرآن الكريم"}</p>
                  <div className="selection-controls" dir="ltr">
                    <Link to={`/quran/${number}`} aria-label="افتح السورة"><BookOpen size={12} /></Link>
                    <button aria-label="السورة السابقة" onClick={() => setSelectionOffset((value) => (value + 113) % 114)}><SkipBack size={12} fill="currentColor" /></button>
                    <button aria-label="تشغيل التلاوة" disabled={!featured[0] || !selectedSurah} onClick={() => { if (featured[0] && selectedSurah) startRecitation(featured[0], selectedSurah); }}><Play size={13} fill="currentColor" /></button>
                    <button aria-label="السورة التالية" onClick={() => setSelectionOffset((value) => (value + 1) % 114)}><SkipForward size={12} fill="currentColor" /></button>
                    <button aria-label="حفظ السورة" aria-pressed={bookmarks.includes(bookmark)} onClick={() => toggleBookmark(bookmark)}><Bookmark size={12} fill={bookmarks.includes(bookmark) ? "currentColor" : "none"} /></button>
                  </div>
                </article>
              );
            })}
          </CardCarousel>
        </Section>
        <Section title="مختارات من الأذكار" to="/adhkar">
          <CardCarousel className="dhikr-carousel" label="مختارات الأذكار">
            {dhikrCategories.map((category) => (
              <Link key={category} to={`/adhkar?category=${encodeURIComponent(category)}`} className="dhikr-preview patterned">
                <div><Moon size={23} /><span className="pill">وقتٌ لذكر الله</span></div>
                <h3>{category}</h3>
                <p>{adhkar.data?.find((row) => row[0] === category)?.[1] || "اجعل لنفسك نصيبًا من الذكر كل يوم."}</p>
                <span className="text-link">ابدأ أذكارك <ArrowUpLeft size={18} /></span>
              </Link>
            ))}
          </CardCarousel>
        </Section>
      </div>
      <div className="home-note">
        <BookOpen size={18} />
        <span>منارة، رفيقك اليومي للقرآن والصلاة</span>
        <span>صُنع بحب، ليطمئن قلبك</span>
      </div>
    </>
  );
}
