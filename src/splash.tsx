import { useEffect, useState } from "react";
const artwork = ["/images/splash-screen-1.svg", "/images/splash-screen-2.svg"];
export default function Splash() {
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem("manara-welcome"); } catch { return true; }
  });
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    const images = artwork.map((src) => {
      const image = new Image();
      image.src = src;
      return image.decode().catch(() => {});
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
  return <div className={`splash smooth-splash ${ready ? "is-ready" : ""} ${closing ? "is-closing" : ""}`} role="status" aria-label="مرحبًا بك في منارة">
    <div className="splash-artwork-stage">
      {artwork.map((src, index) => <div key={src} className={`splash-artwork-layer ${ready && step === index ? "is-active" : ""}`} aria-hidden={step !== index}>
        <img className={index === 0 ? "splash-screen-one" : "splash-screen-two"} src={src} alt={index === 0 ? "منارة — Manara" : "منارة — رفيقك اليومي للقرآن والصلاة"} width="402" height={index === 0 ? 239 : 575} decoding="async" fetchPriority="high" />
      </div>)}
    </div>
    <button className="splash-skip" disabled={closing} onClick={() => setClosing(true)}>ابدأ رحلتك</button>
  </div>;
}
