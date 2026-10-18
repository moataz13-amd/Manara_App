import { useEffect, useState } from "react";
import { Download, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { pendingInstall, type InstallEvent } from "./install-state";

const standalone = () => window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export default function Install() {
  const [request, setRequest] = useState<InstallEvent | null>(pendingInstall);
  const [installed, setInstalled] = useState(standalone);
  const [busy, setBusy] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [message, setMessage] = useState("");
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  useEffect(() => {
    const available = (event: Event) => {
      event.preventDefault();
      setRequest(event as InstallEvent);
      setInstalled(false);
    };
    const completed = () => { setInstalled(true); setRequest(null); };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", completed);
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", completed);
    };
  }, []);
  async function install() {
    if (!request) { setInstructions(true); return; }
    setBusy(true);
    setMessage("");
    try {
      await request.prompt();
      const choice = await request.userChoice;
      setMessage(choice.outcome === "accepted" ? "تم قبول التثبيت. تابع إتمامه من المتصفح." : "يمكنك التثبيت لاحقًا من قائمة المتصفح.");
    } catch { setInstructions(true); }
    finally { setRequest(null); setBusy(false); }
  }
  return <section className="install-page" aria-labelledby="install-title">
    <img src="/images/app-icon-192.png" alt="" width="96" height="96" />
    <h1 id="install-title">منارة معاك في كل وقت</h1>
    <p>القرآن الكريم والتلاوات والأذكار ومواقيت الصلاة، في مكان واحد.</p>
    {installed ? <p role="status">منارة مثبت وجاهز للاستخدام.</p> :
      <button className="primary" disabled={busy} onClick={install}><Download size={20} />{busy ? "جارٍ فتح التثبيت…" : "تثبيت منارة"}</button>}
    {(instructions || ios) && !installed && <div className="install-help">
      <h2>طريقة التثبيت</h2>
      {ios ? <ol><li>افتح الرابط في Safari.</li><li>اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».</li><li>اضغط «إضافة» لتثبيت منارة.</li></ol> :
        <p>افتح الرابط في Chrome أو Edge، ثم افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». لو الرابط مفتوح داخل تطبيق آخر، افتحه في متصفحك أولًا. لو التطبيق مثبت بالفعل، افتحه من أيقونته على جهازك.</p>}
    </div>}
    <Link className="install-continue" to="/">الدخول إلى منارة</Link>
    <button onClick={async () => {
      try {
        await navigator.clipboard.writeText(new URL("/install", window.location.origin).href);
        setMessage("تم نسخ رابط التثبيت.");
      } catch { setMessage("انسخ رابط هذه الصفحة من شريط العنوان لمشاركته."); }
    }}><LinkIcon size={18} /> نسخ رابط التثبيت</button>
    <p className="install-feedback" role="status">{message}</p>
  </section>;
}
