import "./install-state";
import React, { Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  House,
  BookOpen,
  HandHeart,
  AudioLines,
  Settings as SettingsIcon,
  Sun,
  Search,
  MapPin,
  Bell,
  CircleDot,
  ArrowUpLeft,
} from "lucide-react";
import { Logo, Status } from "./ui";
import { usePrefs } from "./store";
import { AudioPlayer, useAudio } from "./audio";
import "./styles.css";
import Splash from "./splash";
import { PrayerReminder } from "./notifications";
const Home = lazy(() => import("./home"));
const Quran = lazy(() => import("./quran"));
const Adhkar = lazy(() => import("./adhkar"));
const Tasbih = lazy(() =>
  import("./adhkar").then((m) => ({ default: m.Tasbih })),
);
const Reciters = lazy(() => import("./reciters"));
const Settings = lazy(() => import("./settings"));
const Prayers = lazy(() =>
  import("./settings").then((m) => ({ default: m.Prayers })),
);
const links = [
  { to: "/", label: "الرئيسية", icon: House },
  { to: "/quran", label: "القرآن الكريم", icon: BookOpen },
  { to: "/reciters", label: "القرّاء والتلاوات", icon: AudioLines },
  { to: "/adhkar", label: "الأذكار والدعاء", icon: HandHeart },
  { to: "/tasbih", label: "المسبحة", icon: CircleDot },
  { to: "/prayers", label: "مواقيت الصلاة", icon: Sun },
];
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="status">
        <h1>حدث خطأ غير متوقع</h1>
        <button onClick={() => window.location.reload()}>إعادة التحميل</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const { theme, place } = usePrefs();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const track = useAudio((s) => s.track);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    setMenu(false);
    if (!location.hash) {
      window.scrollTo(0, 0);
      document.querySelector(".app")?.scrollTo(0, 0);
    }
  }, [location]);
  return (
    <div className={track ? "app with-player" : "app"}>
      <a className="skip-link" href="#main">
        انتقل إلى المحتوى
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Logo />
          <p>رفيقك اليومي للقرآن والصلاة</p>
        </div>
        <span className="nav-caption">رحلتك اليومية</span>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink end={to === "/"} to={to} key={to} aria-label={label}>
              <Icon size={22} strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-message patterned">
            <span>۞</span>
            <p>
              لحظاتٌ من الذكر
              <br />
              تملأ يومك بالسكينة
            </p>
          </div>
          <NavLink className="settings-link" to="/settings">
            <SettingsIcon size={20} /> الإعدادات
          </NavLink>
          <small>منارة · نورٌ يرافقك</small>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="إغلاق القائمة"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar app-header">
          <div className="app-header-info">
            <Link to="/prayers" className="app-header-location">
              <MapPin size={14} strokeWidth={1.6} />
              <span>{place?.name || "اختر موقعك"}</span>
            </Link>
            <time dateTime={new Date().toISOString()}>
              {new Intl.DateTimeFormat("ar-EG-u-ca-islamic", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
                timeZone: place?.timezone || "Africa/Cairo",
              }).format(new Date())}
            </time>
          </div>
          <div className="app-header-logo"><Logo /></div>
          <nav className="app-header-actions" aria-label="أدوات التطبيق" dir="ltr">
            <Link to="/quran?search=1" aria-label="بحث في القرآن"><Search size={19} strokeWidth={1.8} /></Link>
            <Link to="/settings" aria-label="الإعدادات"><SettingsIcon size={19} strokeWidth={1.8} /></Link>
            <Link to="/settings#notifications" aria-label="التنبيهات"><Bell size={18} strokeWidth={1.8} /></Link>
          </nav>
        </header>
        <main id="main">
          <Suspense fallback={<Status />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quran" element={<Quran />} />
              <Route path="/quran/:id" element={<Quran />} />
              <Route path="/adhkar" element={<Adhkar />} />
              <Route path="/tasbih" element={<Tasbih />} />
              <Route path="/reciters" element={<Reciters />} />
              <Route path="/prayers" element={<Prayers />} />
              <Route path="/settings" element={<Settings />} />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>الصفحة غير موجودة</h1>
                    <Link to="/">
                      العودة للرئيسية <ArrowUpLeft />
                    </Link>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
      {createPortal(<div className="mobile-navigation-layer"><nav className="mobile-nav" aria-label="التنقل الرئيسي">
        {[
          { to: "/", label: "الرئيسية", asset: "HomeIcon.svg" },
          { to: "/quran", label: "المصحف", asset: "QuranIcon.svg" },
          { to: "/prayers", label: "أوقات الصلاة", asset: "AwqatIcon.svg" },
          { to: "/tasbih", label: "السبحة", asset: "SebhaIcon.svg" },
        ].map(({ to, label, asset }) => (
          <NavLink end={to === "/"} to={to} key={to} aria-label={label}>
            <i className="nav-asset-icon" aria-hidden="true" style={{ maskImage: `url(/images/${asset})`, WebkitMaskImage: `url(/images/${asset})` }} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button aria-label="المزيد" aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <i className="nav-asset-icon" aria-hidden="true" style={{ maskImage: "url(/images/MoreIcon.svg)", WebkitMaskImage: "url(/images/MoreIcon.svg)" }} />
        </button>
      </nav></div>, document.body)}
      <AudioPlayer />
      <PrayerReminder />
      <Splash />
    </div>
  );
}
const client = new QueryClient({ defaultOptions: { queries: { retry: 2 } } });
const root =
  import.meta.hot?.data.root || createRoot(document.getElementById("root")!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
if (import.meta.env.PROD && "serviceWorker" in navigator)
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
