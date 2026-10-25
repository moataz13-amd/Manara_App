import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Moon, Sunrise } from "lucide-react";
const artwork = ["/images/Manara_App_Logo.svg", "/images/card-pattern.svg"];
export default function Splash() {
  // Replay the launch animation on each new app load; user data is separate.
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    const images = artwork.map((src) => {
      const image = new Image();
      image.src = src;
      if (typeof image.decode === "function") return image.decode().catch(() => {});
      return new Promise<void>((resolve) => {
        if (image.complete) resolve();
        else { image.onload = () => resolve(); image.onerror = () => resolve(); }
      });
    });
    // A slow asset must never trap the user on the welcome screen.
    let timeout: ReturnType<typeof setTimeout>;
    const fallback = new Promise<void>((resolve) => { timeout = setTimeout(resolve, 1800); });
    Promise.race([Promise.all(images), fallback]).then(() => {
      clearTimeout(timeout);
      if (active) setReady(true);
    });
    return () => { active = false; clearTimeout(timeout); };
  }, [visible]);
  useEffect(() => {
    if (!visible || !ready) return;
    const first = setTimeout(() => setStep(1), 1200);
    const second = setTimeout(() => setClosing(true), 3000);
    return () => { clearTimeout(first); clearTimeout(second); };
  }, [visible, ready]);
  useEffect(() => {
    if (!closing) return;
    const timeout = setTimeout(() => {
      try { localStorage.setItem("manara-welcome", "1"); } catch {}
      setVisible(false);
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420);
    return () => clearTimeout(timeout);
  }, [closing]);
  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("showing-splash");
    return () => document.body.classList.remove("showing-splash");
  }, [visible]);
  if (!visible) return null;
  return <div className={`splash smooth-splash refined-splash ${ready ? "is-ready" : ""} ${closing ? "is-closing" : ""}`} dir="rtl" aria-label="مرحبًا بك في منارة">
    <div className="intro-pattern" aria-hidden="true" />
    <div className="intro-topline"><span /> بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ <span /></div>
    <div className="intro-content">
      <div className="intro-brand"><img src={artwork[0]} alt="منارة — Manara" width="180" height="180" fetchPriority="high" /></div>
      <div className="intro-copy-stage" aria-live="polite">
        <div className={`intro-copy ${step === 0 ? "is-active" : ""}`} aria-hidden={step !== 0}>
          <span className="intro-eyebrow">مَسَاحَةٌ لِلسَّكِينَة</span>
          <h1>نورٌ يرافق يومك</h1>
          <p>مع كل آية، طمأنينة.<br />ومع كل ذكر، قلبٌ أقرب.</p>
        </div>
        <div className={`intro-copy ${step === 1 ? "is-active" : ""}`} aria-hidden={step !== 1}>
          <span className="intro-eyebrow">رَفِيقُ رِحْلَتِكَ الإِيمَانِيَّة</span>
          <h2>خيرٌ يبدأ بلحظة</h2>
          <p>قرآنك، أذكارك، ومواقيت صلاتك.<br />كل ما يقرّبك، في مكان واحد.</p>
        </div>
      </div>
      <div className="intro-features"><span><BookOpen size={17} />قرآن</span><span><Sunrise size={18} />صلاة</span><span><Moon size={17} />أذكار</span></div>
    </div>
    <div className="intro-footer">
      <div className="intro-progress" aria-hidden="true"><i className={step === 0 ? "is-active" : ""} /><i className={step === 1 ? "is-active" : ""} /></div>
      <button className="splash-skip" disabled={closing} onClick={() => setClosing(true)}>ابدأ رحلتك <ArrowLeft size={19} /></button>
      <p>قليلٌ دائم، وأثرٌ يبقى</p>
    </div>
  </div>;
}
