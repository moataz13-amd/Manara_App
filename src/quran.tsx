import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Search, Bookmark, ArrowRight } from "lucide-react";
import { useQuran, normalize } from "./data";
import { usePrefs } from "./store";
import { Heading, Status, Empty } from "./ui";
import Reader from "./reader";
export default function Quran() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const query = useQuran();
  const prefs = usePrefs();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("surahs");
  const [juz, setJuz] = useState(1);
  const surah = query.data?.find((s) => s.number === Number(id));
  if (query.isPending) return <Status />;
  if (query.isError) return <Status error retry={() => query.refetch()} />;
  if (id && !surah)
    return (
      <Empty>
        السورة غير موجودة. <Link to="/quran">العودة للفهرس</Link>
      </Empty>
    );
  if (surah) return <Reader surahs={query.data!} surah={surah} />;
  const filtered = query.data?.filter((s) =>
    normalize(s.name + " " + s.englishName + " " + s.number).includes(
      normalize(search),
    ),
  );
  const matches =
    search.length >= 3
      ? query.data
          ?.flatMap((s) =>
            s.ayahs
              .filter((a) => normalize(a.text).includes(normalize(search)))
              .map((a) => ({ s, a })),
          )
          .slice(0, 50)
      : [];
  return (
    <>
      <Heading
        title="القرآن الكريم"
        subtitle="افتح قلبك لكلام الله، واجعل لك كل يوم وردًا."
      />
      <div className="library-banner patterned">
        <span className="large-symbol">۞</span>
        <div>
          <h2>رحلتك مع القرآن</h2>
          <p>١١٤ سورة · ٣٠ جزءًا · نورٌ لا ينطفئ</p>
        </div>
        <Link
          className="primary"
          to={`/quran/${prefs.last.surah}#ayah-${prefs.last.ayah}`}
        >
          متابعة القراءة <ArrowRight size={17} />
        </Link>
      </div>
      <div className="filter-bar">
        <div className="tabs">
          {[
            ["surahs", "السور"],
            ["juz", "الأجزاء"],
            ["bookmarks", "العلامات المرجعية"],
          ].map(([key, name]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {name}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={18} />
          <input
            autoFocus={params.has("search")}
            placeholder="ابحث عن سورة أو آية…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {tab === "surahs" && (
        <div className="surah-grid">
          {filtered?.map((s) => (
            <Link
              className="surah-row"
              key={s.number}
              to={`/quran/${s.number}`}
            >
              <span className="number-medallion">{s.number}</span>
              <div>
                <h3>{s.name}</h3>
                <small>
                  {s.revelationType === "Meccan" ? "مكية" : "مدنية"} ·{" "}
                  {s.ayahs.length} آية
                </small>
              </div>
              <Bookmark
                size={17}
                className={
                  prefs.bookmarks.some((b) => b.startsWith(s.number + ":"))
                    ? ""
                    : "muted"
                }
              />
            </Link>
          ))}
        </div>
      )}
      {tab === "juz" && (
        <>
          <div className="juz-buttons">
            {Array.from({ length: 30 }, (_, i) => (
              <button
                className={juz === i + 1 ? "active" : ""}
                key={i}
                onClick={() => setJuz(i + 1)}
              >
                الجزء {i + 1}
              </button>
            ))}
          </div>
          <div className="surah-grid">
            {query.data
              ?.filter((s) => s.ayahs.some((a) => a.juz === juz))
              .map((s) => (
                <Link
                  className="surah-row"
                  key={s.number}
                  to={`/quran/${s.number}#ayah-${s.ayahs.find((a) => a.juz === juz)?.numberInSurah}`}
                >
                  {s.name}
                </Link>
              ))}
          </div>
        </>
      )}
      {tab === "bookmarks" &&
        (prefs.bookmarks.length ? (
          <div className="surah-grid">
            {prefs.bookmarks.map((b) => {
              const [s, a] = b.split(":").map(Number);
              return (
                <div className="surah-row" key={b}>
                  <Link to={`/quran/${s}#ayah-${a}`}>
                    {query.data?.[s - 1].name} · الآية {a}
                  </Link>
                  <button
                    aria-label="حذف العلامة"
                    onClick={() => prefs.toggleBookmark(b)}
                  >
                    <Bookmark size={18} fill="currentColor" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty>
            <Bookmark />
            <h3>موضعك محفوظ هنا</h3>
            <p>أضف علامة بجانب أي آية للعودة إليها بسهولة.</p>
          </Empty>
        ))}
      {search.length >= 3 && (
        <section className="section">
          <h2>نتائج البحث في الآيات</h2>
          {matches?.length ? (
            matches.map(({ s, a }) => (
              <Link
                className="search-verse"
                key={a.number}
                to={`/quran/${s.number}#ayah-${a.numberInSurah}`}
              >
                <p>{a.text}</p>
                <small>
                  {s.name} · الآية {a.numberInSurah}
                </small>
              </Link>
            ))
          ) : (
            <Empty>لا توجد آيات مطابقة.</Empty>
          )}
        </section>
      )}
    </>
  );
}
