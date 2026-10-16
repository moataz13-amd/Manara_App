import { useEffect, useState } from "react";
let fontReady: Promise<boolean> | undefined;
function loadFont() {
  return fontReady ??= document.fonts.load('32px "Manara Surah"', "001")
    .then((fonts) => fonts.length > 0).catch(() => false);
}
export default function SurahName({ number, name }: { number: number; name: string }) {
  const [state, setState] = useState<"pending" | "ready" | "failed">(() =>
    document.fonts.check('32px "Manara Surah"', "001") ? "ready" : "pending");
  useEffect(() => {
    let active = true;
    loadFont().then((ready) => { if (active) setState(ready ? "ready" : "failed"); });
    return () => { active = false; };
  }, []);
  return <span className={state === "failed" ? "surah-name-fallback" : `surah-name-glyph surah-name-${state}`} dir={state === "failed" ? "rtl" : "ltr"} aria-label={name}>
    {state === "failed" ? name : String(number).padStart(3, "0")}
  </span>;
}
