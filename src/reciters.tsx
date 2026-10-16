import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Headphones, Play, Search, Check } from "lucide-react";
import { useQuran, useReciters, normalize } from "./data";
import { usePrefs } from "./store";
import { Heading, Status, Empty } from "./ui";
import { startRecitation } from "./audio";
export default function Reciters() {
  const query = useReciters();
  const quran = useQuran();
  const [params, setParams] = useSearchParams();
  const prefs = usePrefs();
  const [search, setSearch] = useState("");
  const selected = query.data?.find(
    (r) => r.id === Number(params.get("reciter")),
  );
  if (query.isPending || quran.isPending) return <Status />;
  if (query.isError || quran.isError)
    return (
      <Status
        error
        retry={() => {
          query.refetch();
          quran.refetch();
        }}
      />
    );
  const list = query.data?.filter((r) =>
    normalize(r.name).includes(normalize(search)),
  );
  return (
    <>
      <Heading
        title={selected ? selected.name : "أصواتٌ تُطمئن القلب"}
        subtitle="تلاوات القرآن الكريم، بصوت قارئك المفضل."
      />
      {selected ? (
        <>
          <div className="library-banner patterned">
            <Headphones size={42} />
            <div>
              <h2>{selected.name}</h2>
              <p>{selected.moshaf[0]?.name}</p>
            </div>
            <button
              className="primary"
              onClick={() => prefs.set({ reciter: selected.id })}
            >
              {prefs.reciter === selected.id ? (
                <Check size={17} />
              ) : (
                <Headphones size={17} />
              )}{" "}
              القارئ المفضل
            </button>
            <button onClick={() => setParams({})}>كل القرّاء</button>
          </div>
          <div className="surah-grid">
            {quran.data
              ?.filter((s) =>
                selected.moshaf.some((m) =>
                  m.surah_list.split(",").includes(String(s.number)),
                ),
              )
              .map((s) => (
                <button
                  className="surah-row"
                  key={s.number}
                  onClick={() => startRecitation(selected, s)}
                >
                  <span className="number-medallion">{s.number}</span>
                  <h3 className="mushaf-surah-name reciter-surah-name" aria-label={s.name} dir="ltr">
                    {String(s.number).padStart(3, "0")}
                  </h3>
                  <Play size={18} />
                </button>
              ))}
          </div>
        </>
      ) : (
        <>
          <label className="search wide">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن قارئك المفضل…"
            />
          </label>
          <div className="all-reciters">
            {list?.map((r) => (
              <button
                className="reciter-list-card"
                key={r.id}
                onClick={() => setParams({ reciter: String(r.id) })}
              >
                <div className="initial-medallion">
                  <Headphones size={28} />
                </div>
                <h3>{r.name}</h3>
                <small>{r.moshaf[0]?.name}</small>
                <span className="text-link">
                  استمع للتلاوات <Play size={14} />
                </span>
              </button>
            ))}
          </div>
          {!list?.length && <Empty>لا يوجد قارئ بهذا الاسم.</Empty>}
        </>
      )}
    </>
  );
}
