import { Children, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function SwipePages({ children, label, count, renderPage }: { children?: ReactNode; label: string; count?: number; renderPage?: (index: number) => ReactNode }) {
  const pages = Children.toArray(children);
  const total = count ?? pages.length;
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(0, total - 1));
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppress = useRef(false);
  const go = (delta: number) => setIndex(Math.max(0, Math.min(total - 1, current + delta)));
  if (!total) return null;
  return <section className="swipe-pages" aria-label={label}>
    <div className="swipe-page-content" key={current} tabIndex={0}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest("input,textarea,select")) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); go(e.key === "ArrowLeft" ? 1 : -1); }
      }}
      onPointerDown={(e) => {
        suppress.current = false;
        if (!e.isPrimary || e.button !== 0) return;
        gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        const start = gesture.current;
        if (!start || start.id !== e.pointerId) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          suppress.current = true;
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onPointerUp={(e) => {
        const start = gesture.current;
        gesture.current = null;
        if (!start || start.id !== e.pointerId) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          suppress.current = true;
          go(dx > 0 ? 1 : -1);
        }
      }}
      onPointerCancel={() => { gesture.current = null; }}
      onClickCapture={(e) => { if (suppress.current) { e.preventDefault(); e.stopPropagation(); suppress.current = false; } }}
    >{renderPage ? renderPage(current) : pages[current]}</div>
    <nav className="swipe-page-navigation" aria-label="التنقل بين البطاقات">
      <button aria-label="البطاقة السابقة" disabled={current === 0} onClick={() => go(-1)}><ChevronRight size={22} /></button>
      <span role="status" aria-live="polite">{(current + 1).toLocaleString("ar-EG")} / {total.toLocaleString("ar-EG")}</span>
      <button aria-label="البطاقة التالية" disabled={current === total - 1} onClick={() => go(1)}><ChevronLeft size={22} /></button>
    </nav>
    <p className="swipe-hint">اسحب يمينًا أو يسارًا للتنقل</p>
  </section>;
}
