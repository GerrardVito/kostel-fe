import { Link } from "react-router-dom";

export default function CTABand() {
  return (
    <section className="pt-0 pb-24 max-[720px]:pb-16" id="coba">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="bg-landing-navy text-white rounded-6xl px-10 py-16 text-center">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase font-semibold" style={{ color: "#8fd6c6" }}>
            Mulai Sekarang
          </span>
          <h2 className="font-display text-[clamp(26px,3.6vw,38px)] font-extrabold tracking-tight text-white mt-3">
            Siap kelola kos tanpa drama spreadsheet?
          </h2>
          <p className="text-[#bcd2dc] mt-3.5 text-[16.5px]">
            Buat akun pemilik gratis, tambahkan properti pertama Anda, dan bagikan kode undangan ke penyewa hari ini juga.
          </p>
          <div className="flex gap-3.5 mt-7 justify-center flex-wrap">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-[26px] py-3.5 rounded-[11px] font-semibold text-[16px] bg-white text-landing-navy-deep hover:bg-[#eaf1f5] transition-all hover:-translate-y-px"
            >
              Mulai Gratis
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-[26px] py-3.5 rounded-[11px] font-semibold text-[16px] border border-[rgba(255,255,255,0.3)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-all hover:-translate-y-px"
            >
              Jadwalkan Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
