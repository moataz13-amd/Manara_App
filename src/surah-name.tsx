import { useEffect, useState } from "react";
let fontReady: Promise<boolean> | undefined;
function loadFont() {
  if (!document.fonts?.load) return Promise.resolve(false);
  return fontReady ??= document.fonts.load('32px "Manara Surah"', "001")
    .then((fonts) => fonts.length > 0).catch(() => false);
}
export default function SurahName({ number, name }: { number: number; name: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    loadFont().then((ready) => { if (active) setLoaded(ready); });
    return () => { active = false; };
  }, []);
  // A real Arabic name stays visible even if the font is blocked or offline.
  return <span className={loaded ? "surah-name-glyph" : "surah-name-fallback"} dir={loaded ? "ltr" : "rtl"} aria-label={name}>
    {loaded ? String(number).padStart(3, "0") : name}
  </span>;
}
