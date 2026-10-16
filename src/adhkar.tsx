import { tasbihProgress, tasbihAdhkar } from "./tasbih";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sun, Moon, Heart, RotateCcw, Check, ChevronLeft } from "lucide-react";
import { useAdhkar } from "./data";
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
        row[1].includes(search),
    );
  return (
    <>
      <Heading
        title={category || "الأذكار والدعاء"}
        subtitle="ألا بذكر الله تطمئن القلوب"
      />
      <div className="filter-bar">
        <button
          className={favorites ? "primary" : "secondary"}
          onClick={() => setFavorites(!favorites)}
        >
          <Heart size={17} /> المفضلة
        </button>
        {category && (
          <button
            className="secondary"
            onClick={() => {
              setParams({});
              setFavorites(false);
            }}
          >
            كل الأذكار <ChevronLeft size={17} />
          </button>
        )}
        <input
          aria-label="البحث في الأذكار"
          className="input"
          placeholder="ابحث في الأذكار…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {!category && !favorites ? (
        <div className="adhkar-grid">
          {categories
            .filter((c) => c.includes(search))
            .map((c, i) => (
              <button
                className="adhkar-category patterned"
                key={c}
                onClick={() => setParams({ category: c })}
              >
                {i % 2 ? (
                  <Moon size={30} strokeWidth={1} />
                ) : (
                  <Sun size={30} strokeWidth={1} />
                )}
                <h2>{c}</h2>
                <span>
                  {query.data?.filter((r) => r[0] === c).length} أذكار{" "}
                  <ChevronLeft size={17} />
                </span>
              </button>
            ))}
        </div>
      ) : (
        <div className="dhikr-list">
          {!rows?.length && <Empty>لا توجد أذكار هنا بعد.</Empty>}
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
                    aria-label="إضافة للمفضلة"
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
                          اضغط للتسبيح{" "}
                          <b>
                            {count} / {target}
                          </b>
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
        </div>
      )}
    </>
  );
}
export function Tasbih() {
  const prefs = usePrefs();
  const [confirm, setConfirm] = useState(false);
  const [vibrate, setVibrate] = useState(false);
  const progress = tasbihProgress(prefs.tasbih);
  return (
    <>
      <Heading
        title="المسبحة الإلكترونية"
        subtitle="ذكرٌ يرافقك، وقلبٌ يطمئن."
      />
      <div className="tasbih-panel patterned">
        <div className="tabs">
          {tasbihAdhkar.slice(0, 3).map((d, index) => (
            <span
              key={d}
              className={`tasbih-stage ${progress.stage === index ? "active" : ""}`}
              aria-current={progress.stage === index ? "step" : undefined}
            >
              {d}
            </span>
          ))}
        </div>
        <h2 className={`tasbih-dhikr ${progress.stage === 3 ? "tasbih-final-dhikr" : ""}`} aria-live="polite">{progress.dhikr}</h2>
        <p>اضغط على الدائرة للتسبيح</p>
        <button
          className="counter"
          aria-label="زيادة عداد التسبيح"
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
          <span>{progress.count.toLocaleString("ar-EG")}</span>
          <small>من {progress.target.toLocaleString("ar-EG")}</small>
        </button>
        <p aria-live="polite">
          {progress.complete ? "أتممت المائة، تقبّل الله ذكرك" : progress.stage === 3 ? "اختم المائة بهذا الذكر مرة واحدة" : "كل تسبيحة، أثرٌ طيب"}
        </p>
        <div className="counter-settings">
          <span>المجموع {progress.total.toLocaleString("ar-EG")} / ١٠٠</span>
          <span>الهدف {progress.target.toLocaleString("ar-EG")}</span>
          <button className="secondary" onClick={() => setConfirm(true)}>
            <RotateCcw size={16} /> البدء من جديد
          </button>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={vibrate}
            onChange={(e) => setVibrate(e.target.checked)}
          />{" "}
          اهتزاز خفيف إن كان جهازك يدعمه
        </label>
        {confirm && (
          <div className="reset-confirm" role="alert">
            <p>تصفير عداد التسبيح؟</p>
            <button
              className="primary"
              onClick={() => {
                prefs.set({ tasbih: 0 });
                setConfirm(false);
              }}
            >
              تصفير
            </button>
            <button onClick={() => setConfirm(false)}>إلغاء</button>
          </div>
        )}
      </div>
    </>
  );
}
