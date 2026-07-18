import { Link } from "react-router-dom";

export default function Pricing() {
  return (
    <section className="py-24 max-[720px]:py-16 bg-landing-bg-alt" id="harga">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-[640px] mx-auto text-center">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-landing-teal font-semibold">Harga</span>
          <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-landing-navy-deep mt-2.5">
            Mulai gratis, upgrade saat properti bertambah
          </h2>
        </div>

        <div className="mt-11 grid grid-cols-3 max-[860px]:grid-cols-1 gap-5">
          {/* Starter */}
          <div className="bg-landing-paper border border-landing-line rounded-[18px] p-[30px] flex flex-col">
            <div className="text-[14px] font-bold uppercase tracking-[0.04em] text-landing-teal">Starter</div>
            <div className="font-mono text-[32px] font-semibold mt-3 text-landing-navy-deep">
              Rp 0<span className="text-[14px] text-landing-ink-soft font-body font-medium">/bulan</span>
            </div>
            <p className="mt-2 text-[13.5px] text-landing-ink-soft">Untuk pemilik yang baru mulai mengelola kosnya secara digital.</p>
            <div className="mt-[22px] flex flex-col gap-[11px] flex-1">
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Sampai 5 kamar
              </div>
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Dashboard & tagihan dasar
              </div>
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Aplikasi penyewa via kode undangan
              </div>
            </div>
            <Link
              to="/app"
              className="mt-[26px] w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[9px] font-semibold text-[14.5px] border border-landing-line text-landing-navy-deep hover:bg-white transition-all hover:-translate-y-px"
            >
              Mulai Gratis
            </Link>
          </div>

          {/* Professional — featured */}
          <div className="bg-landing-paper border border-landing-navy rounded-[18px] p-[30px] flex flex-col relative" style={{ boxShadow: "0 20px 50px -30px rgba(0,53,95,0.5)" }}>
            <span className="absolute -top-3 left-6 bg-landing-navy text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-[0.03em]">
              Paling dipilih
            </span>
            <div className="text-[14px] font-bold uppercase tracking-[0.04em] text-landing-teal">Professional</div>
            <div className="font-mono text-[32px] font-semibold mt-3 text-landing-navy-deep">
              Custom<span className="text-[14px] text-landing-ink-soft font-body font-medium"> · sesuai jumlah kamar</span>
            </div>
            <p className="mt-2 text-[13.5px] text-landing-ink-soft">Untuk pengelola kos dan properti dengan puluhan kamar aktif.</p>
            <div className="mt-[22px] flex flex-col gap-[11px] flex-1">
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Sampai 50 kamar
              </div>
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Laporan untung-rugi per kamar
              </div>
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Kontrak digital & tanda tangan
              </div>
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Tiket perbaikan & inspeksi
              </div>
            </div>
            <Link
              to="/app"
              className="mt-[26px] w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[9px] font-semibold text-[14.5px] bg-landing-navy text-white hover:bg-landing-navy-deep transition-all hover:-translate-y-px"
            >
              Coba Professional
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-landing-paper border border-landing-line rounded-[18px] p-[30px] flex flex-col">
            <div className="text-[14px] font-bold uppercase tracking-[0.04em] text-landing-teal">Enterprise</div>
            <div className="font-mono text-[32px] font-semibold mt-3 text-landing-navy-deep">Custom</div>
            <p className="mt-2 text-[13.5px] text-landing-ink-soft">Untuk perusahaan manajemen properti dengan banyak lokasi.</p>
            <div className="mt-[22px] flex flex-col gap-[11px] flex-1">
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Kamar tanpa batas
              </div>
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Multi-properti & multi-tim
              </div>
              <div className="flex gap-[9px] text-[13.8px] text-landing-ink items-start">
                <span className="text-landing-teal font-bold shrink-0">✓</span>Dukungan prioritas
              </div>
            </div>
            <Link
              to="/app"
              className="mt-[26px] w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[9px] font-semibold text-[14.5px] border border-landing-line text-landing-navy-deep hover:bg-white transition-all hover:-translate-y-px"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
