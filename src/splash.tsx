import { useEffect, useState } from "react";
export default function Splash() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem("manara-welcome");
    } catch {
      return false;
    }
  });
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const first = setTimeout(() => setStep(1), 800);
    const second = setTimeout(() => {
      setVisible(false);
      try {
        localStorage.setItem("manara-welcome", "1");
      } catch {}
    }, 1800);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [visible]);
  if (!visible) return null;
  return (
    <div
      className={`splash ${step === 0 ? "splash-first" : "splash-second"}`}
      role="status"
      aria-label="مرحبًا بك في منارة"
    >
      <div className="splash-center">
        {step === 0 ? (
          <img
            className="splash-screen-one"
            src="/images/splash-screen-1.svg"
            alt="منارة — Manara"
            width="402"
            height="239"
          />
        ) : (
          <img
            className="splash-screen-two"
            src="/images/splash-screen-2.svg"
            alt="منارة — رفيقك اليومي للقرآن والصلاة"
            width="402"
            height="575"
          />
        )}
      </div>
      <button
        className="splash-skip"
        onClick={() => {
          setVisible(false);
          try {
            localStorage.setItem("manara-welcome", "1");
          } catch {}
        }}
      >
        ابدأ رحلتك
      </button>
    </div>
  );
}
