import { useLocation } from "react-router-dom";
function Block({ type = "", className = "" }: { type?: string; className?: string }) {
  return <div className={`skeleton-block ${type} ${className}`} />;
}
export default function PageSkeleton() {
  const { pathname, search } = useLocation();
  const reader = /^\/quran\/\d+/.test(pathname);
  const home = pathname === "/";
  const reciters = pathname === "/reciters" && !search.includes("reciter=");
  return <div className={`page-skeleton ${reader ? "skeleton-reader" : ""}`} role="status" aria-label="جارٍ تحميل الصفحة" aria-busy="true">
    <div aria-hidden="true">
      {reader ? <>
        <div className="skeleton-toolbar"><Block type="pill" /><Block type="logo" /><Block type="pill" /></div>
        <Block type="surah-heading" />
        <div className="skeleton-verses">{Array.from({ length: 15 }, (_, i) => <Block key={i} type="verse" />)}</div>
        <Block type="page-number" />
      </> : <>
        <Block type="eyebrow" /><Block type="title" /><Block type="subtitle" />
        {home ? <>
          <div className="home-top-grid skeleton-home-top"><Block type="prayer" /><Block type="continue" /></div>
          <Block type="section-title" />
          <div className="skeleton-grid portraits">{Array.from({ length: 4 }, (_, i) => <Block key={i} type="portrait" />)}</div>
          <div className="home-bottom-grid"><Block type="card" /><Block type="card" /></div>
        </> : <>
          {pathname === "/quran" && <Block type="banner" />}
          <Block type="search" />
          <div className={`skeleton-grid ${reciters ? "portraits" : "rows"}`}>
            {Array.from({ length: reciters ? 8 : 12 }, (_, i) => reciters ? <Block key={i} type="portrait" /> :
              <div className="skeleton-row" key={i}><Block type="medallion" /><div><Block type="row-title" /><Block type="row-detail" /></div></div>)}
          </div>
        </>}
      </>}
    </div>
  </div>;
}
