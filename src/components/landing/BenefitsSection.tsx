export default function BenefitsSection() {
  const benefits = [
    { num: "01", title: "Hemat waktu", desc: "Otomatiskan penagihan dan pengingat yang biasanya dikerjakan manual tiap bulan." },
    { num: "02", title: "Tambah pendapatan", desc: "Lihat profitabilitas per kamar dan ambil keputusan harga berbasis data." },
    { num: "03", title: "Kurangi ribet", desc: "Semua komunikasi dan riwayat penyewa terpusat, bukan tersebar di banyak chat." },
    { num: "04", title: "Tetap rapi", desc: "Kontrak, pembayaran, dan laporan perbaikan tersimpan di satu tempat yang bisa dicari." },
    { num: "05", title: "Mudah berkembang", desc: "Kelola 1 sampai 100+ properti tanpa harus menambah cara kerja yang baru." },
  ];

  return (
    <section className="py-24 max-[720px]:py-16 bg-landing-bg-alt">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-[640px] mx-auto text-center">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-landing-teal font-semibold">Kenapa KOSTEL</span>
          <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-landing-navy-deep mt-2.5">
            Dipilih pemilik yang serius mengelola kosnya
          </h2>
        </div>

        <div className="mt-11 grid grid-cols-5 max-[960px]:grid-cols-2 max-[560px]:grid-cols-1 gap-px bg-landing-line border border-landing-line rounded-4xl overflow-hidden">
          {benefits.map((b) => (
            <div key={b.num} className="bg-landing-paper p-[26px]">
              <span className="font-mono text-[12px] text-landing-teal font-semibold">{b.num}</span>
              <h3 className="text-[15px] font-bold text-landing-navy-deep mt-2.5">{b.title}</h3>
              <p className="mt-2 text-[13.5px] text-landing-ink-soft leading-[1.5]">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
