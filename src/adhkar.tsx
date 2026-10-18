import SwipePages from "./swipe-pages";
import { tasbihProgress, tasbihAdhkar } from "./tasbih";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sun, Moon, Heart, RotateCcw, Check, ChevronLeft, Search, BookOpen } from "lucide-react";
import { useAdhkar, normalize } from "./data";
import { usePrefs } from "./store";
import { Heading, Status, Empty } from "./ui";
export default function Adhkar() {
  const query = useAdhkar();
  const [params, setParams] = useSearchParams();
  const category = params.get("category");
  const prefs = usePrefs();
  const [favorites, setFavorites] = useState(false);
  const [search, setSearch] = useState("");
  const day = new Date().toLocaleDateString("en-CA");
  if (query.isPending) return <Status />;
  if (query.isError) return <Status error retry={() => query.refetch()} />;
  const categories = [...new Set(query.data?.map((r) => r[0]))];
  const rows = query.data
    ?.map((row, id) => ({ row, id }))
    .filter(
      ({ row, id }) =>
        (favorites ? prefs.favorites.includes(id) : row[0] === category) &&
        normalize(row[1]).includes(normalize(search)),
    );
  return (
    <div className="adhkar-page">
      <Heading
        title={favorites ? "أذكاري المفضلة" : category || "الأذكار والدعاء"}
        subtitle="ألا بذكر الله تطمئن القلوب"
      />
      {!category && !favorites && <div className="adhkar-intro"><span className="adhkar-intro-icon"><BookOpen size={26} strokeWidth={1.5} /></span><div><h2>لحظاتٌ يطمئن فيها قلبك</h2><p>اختر من الأذكار والأدعية ما يرافق يومك.</p></div></div>}
      <div className="filter-bar adhkar-toolbar">
        <div className="tabs">
        <button className={!favorites ? "active" : ""} aria-pressed={!favorites} onClick={() => setFavorites(false)}>الأذكار والأدعية</button>
        <button
          className={favorites ? "active" : ""}
          aria-pressed={favorites}
          onClick={() => setFavorites(!favorites)}
        >
          <Heart size={17} /> المفضلة
        </button>
        </div>
        {category && (
          <button
            className="secondary"
            onClick={() => {
              setParams({});
              setFavorites(false);
              setSearch("");
            }}
          >
            كل الأذكار <ChevronLeft size={17} />
          </button>
        )}
        <label className="search"><Search size={18} /><input
          aria-label="البحث في الأذكار"
          placeholder={!category && !favorites ? "ابحث عن قسم…" : "ابحث في نص الذكر…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        /></label>
      </div>
      {!category && !favorites ? (
        <><div className="adhkar-section-heading"><h2>أقسام الأذكار والدعاء</h2><span>{categories.filter((c) => normalize(c).includes(normalize(search))).length.toLocaleString("ar-EG")} قسمًا</span></div><div className="adhkar-grid">
          {categories
            .filter((c) => normalize(c).includes(normalize(search)))
            .map((c) => (
              <button
                className="adhkar-category"
                key={c}
                onClick={() => { setParams({ category: c }); setSearch(""); }}
              >
                <span className="adhkar-category-icon" aria-hidden="true">{c.includes("الصباح") ? <Sun size={24} strokeWidth={1.5} /> : c.includes("المساء") || c.includes("النوم") ? <Moon size={24} strokeWidth={1.5} /> : <BookOpen size={24} strokeWidth={1.5} />}</span>
                <span className="adhkar-category-copy"><h2>{c}</h2><small>{query.data?.filter((r) => r[0] === c).length.toLocaleString("ar-EG")} أذكار</small></span>
                <ChevronLeft className="adhkar-category-arrow" size={18} />
              </button>
            ))}
        </div>{!categories.some((c) => normalize(c).includes(normalize(search))) && <Empty>لا توجد أقسام تطابق بحثك.</Empty>}</>
      ) : (
        <><div className="adhkar-section-heading"><h2>{favorites ? "أذكار حفظتها للرجوع إليها" : "اقرأ على مهل"}</h2><span role="status">{(rows?.length || 0).toLocaleString("ar-EG")} أذكار</span></div>
        {!rows?.length && <Empty>{search ? "لا توجد أذكار تطابق البحث." : "لم تحفظ أذكارًا بعد. اضغط على القلب بجوار الذكر لإضافته هنا."}</Empty>}
        <SwipePages key={`${category}:${favorites}:${search}`} label="الأذكار">
          {rows?.map(({ row, id }) => {
            const key = `${day}:${id}`;
            const count = prefs.counts[key] || 0;
            const target = row[3] && row[3] > 0 ? row[3] : null;
            const done = target !== null && count >= target;
            return (
              <article
                className={`dhikr-full ${done ? "completed" : ""}`}
                key={id}
              >
                <div className="section-heading">
                  <span className="pill">{row[0]}</span>
                  <button
                    aria-label={prefs.favorites.includes(id) ? "إزالة الذكر من المفضلة" : "إضافة الذكر للمفضلة"}
                    aria-pressed={prefs.favorites.includes(id)}
                    onClick={() =>
                      prefs.set({
                        favorites: prefs.favorites.includes(id)
                          ? prefs.favorites.filter((v) => v !== id)
                          : [...prefs.favorites, id],
                      })
                    }
                  >
                    <Heart
                      size={20}
                      fill={
                        prefs.favorites.includes(id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                </div>
                <p className="dhikr-text">{row[1]}</p>
                <small className="source">
                  المصدر: {row[4] || "لم يحدد المرجع في مجموعة البيانات"}
                </small>
                {target && <div className="dhikr-progress"><div className="dhikr-progress-label" role="status"><span>{done ? "أتممت هذا الذكر" : "مرات التكرار"}</span><span>{Math.min(count, target).toLocaleString("ar-EG")} من {target.toLocaleString("ar-EG")}</span></div><progress aria-label="تقدم تكرار الذكر" value={Math.min(count, target)} max={target} /></div>}
                <div className="dhikr-bottom">
                  <button
                    aria-label="إعادة عد الذكر"
                    onClick={() =>
                      prefs.set({ counts: { ...prefs.counts, [key]: 0 } })
                    }
                  >
                    <RotateCcw size={18} />
                  </button>
                  {target ? (
                    <button
                      className={done ? "secondary" : "primary"}
                      disabled={done}
                      onClick={() => prefs.increment(key, target)}
                    >
                      {done ? (
                        <>
                          <Check size={18} /> اكتمل
                        </>
                      ) : (
                        <>
                          قرأت الذكر · اضغط للعد
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="muted">لم يحدد عدد للتكرار في المصدر</span>
                  )}
                </div>
              </article>
            );
          })}
        </SwipePages></>
      )}
    </div>
  );
}
export function Tasbih() {
  const prefs = usePrefs();
  const [confirm, setConfirm] = useState(false);
  const [vibrate, setVibrate] = useState(false);
  const progress = tasbihProgress(prefs.tasbih);
  return (
    <div className="tasbih-page">
      <Heading
        title="المسبحة الإلكترونية"
        subtitle="ذكرٌ يرافقك، وقلبٌ يطمئن."
      />
      <div className="tasbih-panel">
        <div className="tasbih-session-heading"><span>ورد التسبيح</span><span>مائة ذكر</span></div>
        <div className="tasbih-stages" aria-label="مراحل ورد التسبيح">
          {tasbihAdhkar.map((d, index) => (
            <span
              key={d}
              className={`tasbih-stage ${progress.stage === index ? "active" : ""} ${progress.stage > index || progress.complete ? "done" : ""}`}
              aria-current={progress.stage === index ? "step" : undefined}
            >
              <span className="tasbih-stage-marker" aria-hidden="true">{progress.stage > index || progress.complete ? <Check size={14} /> : (index + 1).toLocaleString("ar-EG")}</span>
              <span>{index === 3 ? "ختام المائة" : d}</span>
            </span>
          ))}
        </div>
        <div className="tasbih-current"><span className="tasbih-current-label">{progress.complete ? "اكتمل وردك" : "الذكر الحالي"}</span><h2 className={`tasbih-dhikr ${progress.stage === 3 ? "tasbih-final-dhikr" : ""}`} aria-live="polite">{progress.dhikr}</h2></div>
        <button
          className="counter bead-counter"
          aria-label={`زيادة عداد التسبيح، المجموع ${progress.total} من 100`}
          disabled={progress.complete}
          onClick={() => {
            prefs.set({ tasbih: Math.min(100, progress.total + 1) });
            if (vibrate) navigator.vibrate?.(20);
          }}
          style={
            {
              "--progress": `${Math.min(progress.count / progress.target, 1) * 100}%`,
            } as React.CSSProperties
          }
        >
          <svg className="tasbih-beads" viewBox="0 0 280 360" fill="none" aria-hidden="true">
            <ellipse cx="140" cy="133" rx="112" ry="112" className="tasbih-thread" />
            {Array.from({ length: 33 }, (_, index) => {
              const angle = (100 + index * 10) * Math.PI / 180;
              const x = 140 + 112 * Math.cos(angle);
              const y = 133 + 112 * Math.sin(angle);
              const filled = progress.complete || index < progress.stageCount;
              return <g key={index} className={`tasbih-bead ${filled ? "filled" : ""}`}>
                <circle cx={x} cy={y + 1.5} r="8.5" className="tasbih-bead-shadow" />
                <circle cx={x} cy={y} r="8.5" className="tasbih-bead-body" />
                <ellipse cx={x - 2.5} cy={y - 3} rx="2.8" ry="1.7" className="tasbih-bead-shine" />
              </g>;
            })}
            <path d="M121 243 Q140 259 159 243 M140 251 V264" className="tasbih-thread" />
            <path d="M136 261 Q130 269 134 284 L137 292 H143 L146 284 Q150 269 144 261 Z" className="tasbih-imam" />
            <path d="M140 292 V304 M136 302 Q122 321 123 343 M138 303 Q130 324 130 347 M140 303 V350 M142 303 Q150 324 150 347 M144 302 Q158 321 157 343" className="tasbih-tassel" />
            <path d="M133 304 H147 M132 308 H148" className="tasbih-tassel-wrap" />
          </svg>
          <span className="tasbih-bead-readout"><span className="tasbih-bead-number">{progress.count.toLocaleString("ar-EG")}</span>
            <small>من {progress.target.toLocaleString("ar-EG")}</small>
            <span className="tasbih-counter-hint">{progress.complete ? "تقبّل الله ذكرك" : "اضغط للتسبيح"}</span>
          </span>
        </button>
        <p className="tasbih-status" role="status">
          {progress.complete ? "أتممت المائة، تقبّل الله ذكرك" : progress.stage === 3 ? "اختم المائة بهذا الذكر مرة واحدة" : "كل تسبيحة، أثرٌ طيب"}
        </p>
        <div className="tasbih-summary"><span>أتممت <b>{progress.total.toLocaleString("ar-EG")}</b> ذكرًا</span><span>متبقي <b>{(100 - progress.total).toLocaleString("ar-EG")}</b></span></div>
        <div className="tasbih-options">
          <button className="secondary" onClick={() => setConfirm(true)}>
            <RotateCcw size={16} /> البدء من جديد
          </button>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={vibrate}
            onChange={(e) => setVibrate(e.target.checked)}
          />{" "}
          اهتزاز خفيف <span className="tasbih-option-note">إن كان جهازك يدعمه</span>
        </label>
        </div>
        {confirm && (
          <div className="reset-confirm" role="alert">
            <p>تبدأ وردًا جديدًا؟</p><small>سيعود العدّاد إلى الصفر.</small>
            <div className="tasbih-confirm-actions">
            <button
              className="primary"
              onClick={() => {
                prefs.set({ tasbih: 0 });
                setConfirm(false);
              }}
            >
              ابدأ من جديد
            </button>
            <button className="secondary" onClick={() => setConfirm(false)}>متابعة وردي</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
