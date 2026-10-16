import { useEffect, useState } from "react";
export default function SurahName({ number, name }: { number: number; name: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    if (document.fonts) {
      document.fonts.load('32px "Manara Surah"', String(number).padStart(3, "0"))
        .then((fonts) => { if (active && fonts.length > 0) setLoaded(true); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [number]);
  return <span className={loaded ? "surah-name-glyph" : "surah-name-fallback"} dir={loaded ? "ltr" : "rtl"} aria-label={name}>
    {loaded ? String(number).padStart(3, "0") : name}
  </span>;
}
