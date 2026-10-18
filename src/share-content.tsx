import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, Download, Copy, X } from "lucide-react";

export interface ShareContent { title: string; text: string; reference: string; url?: string; layout?: "mushaf"; imageText?: string; surahNumber?: number }

export async function makeShareImages(content: ShareContent): Promise<File[]> {
  await Promise.all([document.fonts.load('36px "Amiri"'), document.fonts.load('26px "Tajawal"'), document.fonts.load('bold 28px "Tajawal"')]);
  const mushaf = content.layout === "mushaf";
  let frame: HTMLImageElement | undefined;
  if (mushaf) {
    await Promise.all([document.fonts.load('36px "Manara Uthmanic Hafs"'), document.fonts.load('70px "Manara Surah"', String(content.surahNumber).padStart(3, "0"))]);
    frame = new Image(); frame.src = "/images/surah-frame.svg";
    await frame.decode();
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const font = mushaf ? '36px "Manara Uthmanic Hafs"' : '36px "Amiri", serif';
  const isMarker = (word: string) => mushaf && /^﴿[٠-٩]+﴾$/.test(word);
  const measure = (word: string) => { ctx.font = font; return isMarker(word) ? 48 : ctx.measureText(word).width; };
  const measureLine = (line: string) => line.split(" ").reduce((width, word, index) => width + measure(word) + (index ? 9 : 0), 0);
  ctx.font = font;
  const lines: string[] = [];
  for (const paragraph of (content.imageText ?? content.text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && (mushaf ? measureLine(next) : ctx.measureText(next).width) > 880) { lines.push(line); line = word; }
      else line = next;
    }
    lines.push(line);
  }
  const files: File[] = [];
  const perPage = 19;
  for (let offset = 0; offset < lines.length; offset += perPage) {
    const chunk = lines.slice(offset, offset + perPage);
    const textTop = mushaf ? 330 : 235;
    canvas.height = Math.max(660, textTop + 135 + chunk.length * 68);
    ctx.fillStyle = "#f6faf7"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#bddbd2"; ctx.lineWidth = 2; ctx.strokeRect(36, 36, 1008, canvas.height - 72);
    ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.fillStyle = "#104f40";
    ctx.font = 'bold 28px "Tajawal", sans-serif'; ctx.fillText("منارة", 540, 94);
    if (frame && content.surahNumber) {
      ctx.drawImage(frame, 90, 120, 900, 176);
      ctx.save(); ctx.direction = "ltr";
      ctx.font = '70px "Manara Surah"'; ctx.textBaseline = "middle";
      ctx.fillText(String(content.surahNumber).padStart(3, "0"), 540, 208);
      ctx.restore();
    } else { ctx.font = '26px "Tajawal", sans-serif'; ctx.fillText(content.title, 540, 150, 900); }
    ctx.font = font;
    chunk.forEach((line, index) => {
      const words = line.split(" ");
      if (mushaf) {
        const widths = words.map(measure);
        const justify = offset + index < lines.length - 1 && words.length > 1;
        const gap = justify ? (880 - widths.reduce((sum, width) => sum + width, 0)) / (words.length - 1) : 9;
        ctx.textAlign = "right";
        let x = justify ? 980 : 540 + (widths.reduce((sum, width) => sum + width, 0) + gap * (words.length - 1)) / 2;
        words.forEach((word, i) => {
          const y = textTop + index * 68;
          if (isMarker(word)) {
            ctx.save();
            const cx = x - 24, cy = y - 12;
            // A scalloped Quran verse medallion, with a clear inner ring.
            ctx.strokeStyle = "#104f40"; ctx.lineWidth = 1.3;
            ctx.beginPath();
            for (let step = 0; step <= 240; step++) {
              const angle = step * Math.PI * 2 / 240;
              const radius = 20.5 + 2.5 * Math.cos(12 * angle);
              const px = cx + radius * Math.cos(angle), py = cy + radius * Math.sin(angle);
              if (step === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.lineWidth = 0.9; ctx.stroke();
            ctx.font = '21px "Tajawal"'; ctx.textAlign = "center"; ctx.direction = "rtl";
            ctx.fillText(word.slice(1, -1), x - 24, y - 5); ctx.restore();
          } else { ctx.font = font; ctx.fillText(word, x, y); }
          x -= widths[i] + gap;
        });
        ctx.textAlign = "center";
      } else ctx.fillText(line, 540, textTop + index * 68);
    });
    ctx.font = '24px "Tajawal", sans-serif';
    ctx.fillText(content.reference, 540, canvas.height - 100, 900);
    ctx.font = '20px "Tajawal", sans-serif';
    ctx.fillText(`منارة · ${Math.floor(offset / perPage) + 1} / ${Math.ceil(lines.length / perPage)}`, 540, canvas.height - 60);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("image")), "image/png"));
    files.push(new File([blob], `manara-${files.length + 1}.png`, { type: "image/png" }));
  }
  return files;
}

export default function ShareContentDialog({ content, onClose, children, disabled = false }: { content: ShareContent; onClose: () => void; children?: React.ReactNode; disabled?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [images, setImages] = useState<{ files: File[]; urls: string[] } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const text = `${content.layout === "mushaf" ? `${content.title}\n\n` : ""}${content.text}\n\n${content.reference}${content.url ? `\n${content.url}` : ""}`;
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    setImages(null); setMessage("");
    if (mode === "image" && !disabled) {
      void makeShareImages(content).then((files) => {
        if (!active) return;
        urls.push(...files.map((file) => URL.createObjectURL(file)));
        setImages({ files, urls });
      }).catch(() => { if (active) setMessage("تعذّر تجهيز الصورة. جرّب المشاركة كنص."); });
    }
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [mode, content.text, content.imageText, content.surahNumber, content.reference, content.title, content.layout, disabled]);
  async function share() {
    setBusy(true); setMessage("");
    try {
      if (mode === "image" && images) {
        if (navigator.canShare?.({ files: images.files })) await navigator.share({ files: images.files, title: content.title });
        else setMessage("المتصفح لا يدعم مشاركة الصور مباشرة. احفظ الصور من الأزرار أسفل المعاينة.");
      } else if (navigator.share) await navigator.share({ title: content.title, text });
      else { await navigator.clipboard.writeText(text); setMessage("تم نسخ النص، ويمكنك لصقه في التطبيق الذي تريده."); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("تعذّرت المشاركة. يمكنك نسخ النص أو حفظ الصور يدويًا.");
    } finally { setBusy(false); }
  }
  return createPortal(<dialog ref={dialog} className="share-dialog" dir="rtl" onCancel={onClose} onClose={onClose} onKeyDown={(event) => event.stopPropagation()}>
    <header><h2>مشاركة {content.title}</h2><button aria-label="إغلاق المشاركة" onClick={onClose}><X size={21} /></button></header>
    {children}
    <div className="tabs"><button aria-pressed={mode === "text"} className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}>كنص</button><button aria-pressed={mode === "image"} className={mode === "image" ? "active" : ""} onClick={() => setMode("image")}>كصورة</button></div>
    {mode === "text" ? <textarea className="share-text-preview" aria-label="النص المراد مشاركته" readOnly value={text} /> : <div className="share-images">
      {!images && !message && !disabled && <p role="status">جارٍ تجهيز الصور…</p>}
      {images && images.files.length > 1 && <p>تم تقسيم النص إلى {images.files.length} صور للحفاظ على وضوحه كاملًا.</p>}
      {images?.urls.map((url, index) => <figure key={url}><img src={url} alt={`معاينة المشاركة، الصورة ${index + 1}`} /><a className="secondary" href={url} download={`manara-${index + 1}.png`}><Download size={17} /> حفظ الصورة {index + 1}</a></figure>)}
    </div>}
    <p role="status">{message}</p>
    <footer><button className="primary" disabled={disabled || busy || (mode === "image" && !images)} onClick={share}><Share2 size={18} /> مشاركة {mode === "text" ? "النص" : "الصور"}</button>
      {mode === "text" && <button className="secondary" disabled={disabled} onClick={async () => { try { await navigator.clipboard.writeText(text); setMessage("تم نسخ النص."); } catch { setMessage("حدّد النص من المعاينة وانسخه يدويًا."); } }}><Copy size={18} /> نسخ النص</button>}
    </footer>
  </dialog>, document.body);
}
