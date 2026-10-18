import { useState } from "react";
import type { Surah } from "./data";
import ShareContentDialog from "./share-content";

export default function ShareVerses({ surah, initial, onClose }: { surah: Surah; initial: number; onClose: () => void }) {
  const [startInput, setStart] = useState(String(initial));
  const [endInput, setEnd] = useState(String(initial));
  const parse = (value: string) => Number(value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))));
  const start = parse(startInput), end = parse(endInput);
  const valid = Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end >= start && end <= surah.ayahs.length;
  const verses = surah.ayahs.filter((ayah) => ayah.numberInSurah >= start && ayah.numberInSurah <= end);
  const reference = `${surah.name} · ${start === end ? `الآية ${start}` : `الآيات ${start}–${end}`}`;
  return <ShareContentDialog disabled={!valid} content={{ title: surah.name, layout: "mushaf", surahNumber: surah.number, imageText: valid ? verses.map((ayah) => `${ayah.displayText ?? ayah.text} ﴿${ayah.numberInSurah.toLocaleString("ar-EG")}﴾`).join(" ") : "", reference, text: valid ? verses.map((ayah) => `${ayah.text} ﴿${ayah.numberInSurah.toLocaleString("ar-EG")}﴾`).join(" ") : "", url: `${window.location.origin}/quran/${surah.number}#ayah-${start}` }} onClose={onClose}>
    <p>{surah.name} · اختر آية واحدة أو مجموعة متتالية، حتى لو امتدت إلى صفحات أخرى.</p>
    <div className="share-verse-range">
      <label>من الآية<input inputMode="numeric" value={startInput} aria-invalid={!valid} onChange={(event) => setStart(event.target.value)} /></label>
      <label>إلى الآية<input inputMode="numeric" value={endInput} aria-invalid={!valid} onChange={(event) => setEnd(event.target.value)} /></label>
    </div>
    {!valid && <p role="alert">اكتب أرقامًا من ١ إلى {surah.ayahs.length.toLocaleString("ar-EG")}، ونهاية لا تقل عن البداية.</p>}
  </ShareContentDialog>;
}
