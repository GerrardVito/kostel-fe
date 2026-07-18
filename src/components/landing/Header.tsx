import { useState } from "react";
import { Link } from "react-router-dom";

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-landing-line"
      style={{ background: "rgba(244,247,248,0.9)", backdropFilter: "blur(10px)" }}
    >
      <div className="flex items-center justify-between px-6 py-4 max-w-[1160px] mx-auto">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2.5 font-display font-extrabold text-[20px] text-landing-navy-deep" aria-label="KOSTEL beranda">
          <span className="w-[30px] h-[30px] rounded-[7px] bg-landing-navy grid grid-cols-2 gap-0.5 p-1" aria-hidden="true">
            <span className="rounded-[1.5px] bg-[#3fd68a]" />
            <span className="rounded-[1.5px] bg-landing-bg" />
            <span className="rounded-[1.5px] bg-landing-bg" />
            <span className="rounded-[1.5px] bg-[#e0a63e]" />
          </span>
          KOSTEL
        </a>

        {/* Desktop nav */}
        <nav className="hidden max-[860px]:hidden min-[861px]:flex gap-8 text-[14.5px] font-medium" aria-label="Navigasi utama">
          <a href="#fitur" className="text-landing-ink-soft hover:text-landing-navy-deep transition-colors">Fitur</a>
          <a href="#cara-kerja" className="text-landing-ink-soft hover:text-landing-navy-deep transition-colors">Cara Kerja</a>
          <a href="#keuangan" className="text-landing-ink-soft hover:text-landing-navy-deep transition-colors">Keuangan</a>
          <a href="#harga" className="text-landing-ink-soft hover:text-landing-navy-deep transition-colors">Harga</a>
          <a href="#faq" className="text-landing-ink-soft hover:text-landing-navy-deep transition-colors">FAQ</a>
        </nav>

        {/* Desktop CTAs */}
        <div className="flex items-center gap-4">
          <Link
            to="/app"
            className="hidden max-[860px]:hidden min-[861px]:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[9px] font-semibold text-[14.5px] border border-landing-line text-landing-navy-deep hover:bg-white transition-all"
          >
            Masuk
          </Link>
          <Link
            to="/app"
            className="hidden max-[860px]:hidden min-[861px]:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[9px] font-semibold text-[14.5px] bg-landing-navy text-white hover:bg-landing-navy-deep transition-all"
          >
            Coba Gratis
          </Link>

          {/* Mobile hamburger */}
          <button
            className="min-[861px]:hidden flex flex-col gap-[5px] p-1.5 bg-transparent border-none cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Buka menu"
          >
            <span className="block w-[22px] h-[2px] bg-landing-navy-deep rounded-[2px]" />
            <span className="block w-[22px] h-[2px] bg-landing-navy-deep rounded-[2px]" />
            <span className="block w-[22px] h-[2px] bg-landing-navy-deep rounded-[2px]" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`flex flex-col gap-0.5 px-6 pb-5 pt-2 border-t border-landing-line ${mobileOpen ? "flex" : "hidden"}`}
      >
        <a href="#fitur" onClick={closeMobile} className="py-3 px-1 font-medium text-landing-ink-soft border-b border-landing-line">Fitur</a>
        <a href="#cara-kerja" onClick={closeMobile} className="py-3 px-1 font-medium text-landing-ink-soft border-b border-landing-line">Cara Kerja</a>
        <a href="#keuangan" onClick={closeMobile} className="py-3 px-1 font-medium text-landing-ink-soft border-b border-landing-line">Keuangan</a>
        <a href="#harga" onClick={closeMobile} className="py-3 px-1 font-medium text-landing-ink-soft border-b border-landing-line">Harga</a>
        <a href="#faq" onClick={closeMobile} className="py-3 px-1 font-medium text-landing-ink-soft border-b border-landing-line">FAQ</a>
        <a href="#coba" onClick={closeMobile} className="py-3 px-1 font-medium text-landing-ink-soft">Coba Gratis</a>
      </div>
    </header>
  );
}
