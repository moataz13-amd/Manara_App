import { resolveCurrentCity, validCoordinates, validTimeZone } from "./location";
import { lazy, Suspense, useState } from "react";
const Account = lazy(() => import("./auth"));
import { NotificationSettings } from "./notifications";
import {
  MapPin,
  LocateFixed,
  Check,
  Sun,
  Moon,
  Globe,
  BookOpen,
  Shield,
} from "lucide-react";
import { usePrefs, type Place } from "./store";
import { Heading } from "./ui";
import { PrayerCard, prayerIcons } from "./home";
import { usePrayer } from "./prayer";
const cities: Place[] = [
  {
    name: "القاهرة، مصر",
    lat: 30.0444,
    lon: 31.2357,
    timezone: "Africa/Cairo",
  },
  {
    name: "الإسكندرية، مصر",
    lat: 31.2001,
    lon: 29.9187,
    timezone: "Africa/Cairo",
  },
  {
    name: "مكة المكرمة، السعودية",
    lat: 21.4225,
    lon: 39.8262,
    timezone: "Asia/Riyadh",
  },
  {
    name: "المدينة المنورة، السعودية",
    lat: 24.4672,
    lon: 39.6111,
    timezone: "Asia/Riyadh",
  },
  {
    name: "الرياض، السعودية",
    lat: 24.7136,
    lon: 46.6753,
    timezone: "Asia/Riyadh",
  },
  { name: "دبي، الإمارات", lat: 25.2048, lon: 55.2708, timezone: "Asia/Dubai" },
  {
    name: "لندن، المملكة المتحدة",
    lat: 51.5074,
    lon: -0.1278,
    timezone: "Europe/London",
  },
];
export function LocationSettings() {
  const prefs = usePrefs();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [zone, setZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [name, setName] = useState("");
  const locate = () => {
    if (!window.isSecureContext) {
      setStatus("تحديد الموقع التلقائي يحتاج رابط HTTPS. اختر مدينتك من القائمة، وسيتم حفظها على جهازك.");
      return;
    }
    if (!navigator.geolocation) {
      setStatus("المتصفح لا يدعم تحديد الموقع. اختر المدينة يدويًا.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(String(latitude));
        setLon(String(longitude));
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        try {
          if (!validCoordinates(latitude, longitude)) throw new Error("Invalid coordinates");
          const cityName = resolveCurrentCity(latitude, longitude, controller.signal).catch(() => null);
          const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto&forecast_days=1`,
            { signal: controller.signal },
          );
          if (!r.ok) throw new Error();
          const result = await r.json();
          if (!validTimeZone(result.timezone)) throw new Error("Invalid timezone");
          const resolvedName = await cityName;
          const placeName = resolvedName || "موقعي الحالي";
          prefs.set({
            place: {
              name: placeName,
              lat: latitude,
              lon: longitude,
              timezone: result.timezone,
            },
          });
          setStatus(resolvedName ? "تم حفظ المدينة والموقع." : "تم حفظ الموقع، لكن تعذّر معرفة اسم المدينة الآن. يمكنك إعادة المحاولة أو إدخال اسمها يدويًا.");
        } catch {
          setStatus(
            "تعذّر تحديد المنطقة الزمنية. أدخل الإحداثيات والمنطقة الزمنية يدويًا.",
          );
        } finally {
          clearTimeout(timeout);
          setBusy(false);
        }
      },
      (error) => {
        setStatus(error.code === 1
          ? "إذن الموقع مرفوض. اسمح به من إعدادات المتصفح أو اختر مدينتك يدويًا."
          : error.code === 3
            ? "انتهت مهلة تحديد الموقع. حاول مرة أخرى أو اختر مدينتك يدويًا."
            : "الموقع غير متاح الآن. اختر مدينتك يدويًا وسيتم حفظها.");
        setBusy(false);
      },
      { timeout: 15000, maximumAge: 300000, enableHighAccuracy: false },
    );
  };
  return (
    <div className="settings-card" id="location">
      <h2>
        <MapPin size={21} /> موقعك
      </h2>
      <p>اختر مدينتك لحساب مواقيت الصلاة بالتوقيت المحلي.</p>
      <div className="location-options">
        <select
          aria-label="اختيار المدينة"
          value={cities.find((c) => c.name === prefs.place?.name)?.name || ""}
          onChange={(e) => {
            const city = cities.find((c) => c.name === e.target.value);
            if (city) {
              prefs.set({ place: city });
              setStatus("تم حفظ المدينة");
            }
          }}
        >
          <option value="">اختر مدينة</option>
          {cities.map((c) => (
            <option key={c.name}>{c.name}</option>
          ))}
        </select>
        <button className="primary" disabled={busy} onClick={locate}>
          <LocateFixed size={17} />
          {busy ? "جارٍ تحديد الموقع…" : "استخدم موقعي"}
        </button>
      </div>
      {prefs.place && (
        <p className="saved-location">
          <Check size={16} />
          {prefs.place.name} · {prefs.place.timezone}
        </p>
      )}
      <details>
        <summary>مدينة أخرى / إدخال الإحداثيات</summary>
        <form
          className="coordinate-form"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              if (!lat.trim() || !lon.trim() || !validCoordinates(Number(lat), Number(lon))) {
                setStatus("أدخل خط عرض من −٩٠ إلى ٩٠ وخط طول من −١٨٠ إلى ١٨٠.");
                return;
              }
              if (!validTimeZone(zone.trim())) throw new Error("Invalid timezone");
              prefs.set({
                place: {
                  name: name || `${lat}, ${lon}`,
                  lat: Number(lat),
                  lon: Number(lon),
                  timezone: zone.trim(),
                },
              });
              setStatus("تم حفظ الموقع");
            } catch {
              setStatus("أدخل منطقة زمنية صحيحة مثل Africa/Cairo");
            }
          }}
        >
          <label>
            اسم الموقع
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            خط العرض
            <input
              required
              type="number"
              min="-90"
              max="90"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </label>
          <label>
            خط الطول
            <input
              required
              type="number"
              min="-180"
              max="180"
              step="any"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
            />
          </label>
          <label>
            المنطقة الزمنية
            <input
              required
              dir="ltr"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            />
          </label>
          <button className="primary">حفظ الموقع</button>
        </form>
      </details>
      <p role="status">{status}</p>
    </div>
  );
}
function CalculationSettings() {
  const prefs = usePrefs();
  return (
    <div className="settings-card">
      <h2>
        <Sun size={21} /> حساب مواقيت الصلاة
      </h2>
      <label className="setting-row">
        طريقة الحساب
        <select
          value={prefs.method}
          onChange={(e) => prefs.set({ method: e.target.value })}
        >
          <option value="Egyptian">الهيئة المصرية العامة للمساحة</option>
          <option value="MuslimWorldLeague">رابطة العالم الإسلامي</option>
          <option value="UmmAlQura">أم القرى</option>
        </select>
      </label>
      <label className="setting-row">
        حساب صلاة العصر
        <select
          value={prefs.hanafi ? "hanafi" : "shafi"}
          onChange={(e) => prefs.set({ hanafi: e.target.value === "hanafi" })}
        >
          <option value="shafi">الجمهور</option>
          <option value="hanafi">الحنفي</option>
        </select>
      </label>
      <label className="setting-row">
        تنسيق الوقت
        <select
          value={prefs.hour12 ? "12" : "24"}
          onChange={(e) => prefs.set({ hour12: e.target.value === "12" })}
        >
          <option value="12">١٢ ساعة</option>
          <option value="24">٢٤ ساعة</option>
        </select>
      </label>
      <p className="muted">
        المواقيت محسوبة فلكيًا، وقد تختلف عن جدول المسجد المحلي.
      </p>
    </div>
  );
}
export function Prayers() {
  const prayer = usePrayer();
  return (
    <div className="prayers-page">
      <Heading
        title="مواقيت الصلاة"
        subtitle="إن الصلاة كانت على المؤمنين كتابًا موقوتًا"
      />
      <PrayerCard />
      <div className="prayers-layout">
        <div className="prayer-preferences">
          <LocationSettings />
          <CalculationSettings />
        </div>
        <div className="settings-card prayer-schedule">
          <h2>صلوات اليوم</h2>
          <p>{prayer.dateLabel} · تتحدث تلقائيًا حسب المدينة المختارة</p>
          {prayer.rows.length ? (
            prayer.rows.map((p, i) => {
              const Icon = prayerIcons[i];
              return (
                <div
                  className={`prayer-detail ${prayer.next?.key === p.key ? "active" : ""}`}
                  key={p.key}
                >
                  <Icon size={25} />
                  <b>{p.name}{prayer.next?.key === p.key && <small className="next-prayer-label">القادمة</small>}</b>
                  <time>{prayer.format(p.time)}</time>
                </div>
              );
            })
          ) : (
            <p>اختر موقعك لعرض جدول اليوم.</p>
          )}
        </div>
      </div>
    </div>
  );
}
export default function Settings() {
  const prefs = usePrefs();
  return (
    <>
      <Heading title="الإعدادات" subtitle="اجعل منارة أقرب إليك." />
      <div className="settings-grid">
        <div>
          <Suspense fallback={<p role="status">جارٍ تحميل إعدادات الحساب…</p>}><Account /></Suspense>
          <NotificationSettings />
          <div className="settings-card">
            <h2>
              <Sun size={21} /> المظهر والقراءة
            </h2>
            <div className="theme-options">
              <button
                className={prefs.theme === "light" ? "active" : ""}
                onClick={() => prefs.set({ theme: "light" })}
              >
                <Sun /> الوضع الفاتح
              </button>
              <button
                className={prefs.theme === "dark" ? "active" : ""}
                onClick={() => prefs.set({ theme: "dark" })}
              >
                <Moon /> الوضع الداكن
              </button>
            </div>
            <label className="setting-row">
              <span>
                <BookOpen size={18} /> حجم خط القرآن
              </span>
              <input
                type="range"
                min="22"
                max="48"
                value={prefs.fontSize}
                onChange={(e) =>
                  prefs.set({ fontSize: Number(e.target.value) })
                }
              />
              <b>{prefs.fontSize}</b>
            </label>
            <p className="font-preview" style={{ fontSize: prefs.fontSize }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <div className="setting-row">
              <span>
                <Globe size={18} /> لغة التطبيق
              </span>
              <span>العربية</span>
            </div>
          </div>
          <div className="settings-card">
            <h2>
              <Shield size={21} /> الخصوصية والبيانات
            </h2>
            <p>
              تُحفظ علاماتك المرجعية وموضع القراءة وإعداداتك محليًا في هذا
              المتصفح.
            </p>
            <p>
              لا يُطلب موقعك إلا عند الضغط على «استخدم موقعي». تستخدم خدمة
              Open-Meteo لتحديد المنطقة الزمنية وBigDataCloud لمعرفة اسم المدينة.
            </p>
            <button
              className="secondary"
              onClick={() => {
                const { set, toggleBookmark, increment, ...data } =
                  usePrefs.getState();
                void set;
                void toggleBookmark;
                void increment;
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "manara-preferences.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              تنزيل نسخة من بياناتي
            </button>
          </div>
        </div>
        <div>
          <LocationSettings />
          <CalculationSettings />
        </div>
      </div>
    </>
  );
}
