import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { pendingInstall, type InstallEvent } from "./install-state";
const installedKey = "manara-installed";
function stored(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function save(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} }
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
export default function InstallPrompt() {
  const [request, setRequest] = useState<InstallEvent | null>(pendingInstall);
  const [installed, setInstalled] = useState(() => isStandalone() || stored(installedKey) === "1");
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const markInstalled = () => { save(installedKey, "1"); setInstalled(true); setRequest(null); };
    const modeChanged = () => { if (isStandalone()) markInstalled(); };
    const available = (event: Event) => {
      event.preventDefault();
      if (isStandalone()) return;
      // This browser has positively determined the app is installable.
      setInstalled(false);
      setRequest(event as InstallEvent);
    };
    modeChanged();
    const pending = pendingInstall();
    if (pending && !isStandalone()) available(pending);
    const timer = window.setTimeout(() => setReady(true), 1500);
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", markInstalled);
    media.addEventListener("change", modeChanged);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", markInstalled);
      media.removeEventListener("change", modeChanged);
    };
  }, []);
  const dismiss = () => setDismissed(true);
  if (!ready || installed || dismissed) return null;
  return <aside className="install-prompt" aria-label="تثبيت تطبيق منارة">
    <img src="/images/app-icon-192.png" alt="" width="44" height="44" />
    <div><strong>خلي منارة معاك دائمًا</strong><p>{request ? "ثبّت التطبيق لفتحه بسهولة من شاشة جهازك." : ios ? "من قائمة المشاركة، اختر إضافة إلى الشاشة الرئيسية لتثبيت منارة." : "من قائمة المتصفح، اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية."}</p></div>
    {request && <button className="primary" disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        await request.prompt();
        const choice = await request.userChoice;
        if (choice.outcome === "dismissed") dismiss();
        setRequest(null);
      } catch { setRequest(null); }
      finally { setBusy(false); }
    }}><Download size={16} /> تثبيت</button>}
    <button className="install-dismiss" aria-label="إغلاق رسالة التثبيت" onClick={dismiss}><X size={18} /></button>
  </aside>;
}
