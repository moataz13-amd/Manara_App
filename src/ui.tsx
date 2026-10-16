import { Link } from "react-router-dom";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="منارة الرئيسية">
      <img
        src="/images/Manara_App_H_Logo.svg"
        alt="منارة — Manara"
        className="brand-logo"
      />
    </Link>
  );
}
export function Section({
  title,
  to,
  children,
}: {
  title: string;
  to?: string;
  children?: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>{title}</h2>
        {to && (
          <Link to={to}>
            المزيد <ChevronLeft size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">مَنارة · مساحة للسكينة</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
export function Status({
  error = false,
  retry,
}: {
  error?: boolean;
  retry?: () => void;
}) {
  return (
    <div className="status" role="status">
      {error ? (
        <>
          <p>تعذّر تحميل المحتوى. تحقق من اتصالك وحاول مجددًا.</p>
          <button onClick={retry}>إعادة المحاولة</button>
        </>
      ) : (
        <>
          <LoaderCircle className="spin" /> جارٍ تحميل المحتوى…
        </>
      )}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
