export default function Testimonials() {
  const testimonials = [
    {
      quote: "Dulu saya cek 15 kos lewat 15 grup WhatsApp berbeda. Sekarang semua status kamar dan tagihan ada di satu layar.",
      initials: "RS",
      name: "Rahmat S.",
      role: "Pengelola 15 rumah kos, Bandung",
    },
    {
      quote: "Bayar sewa dan lapor kerusakan kamar sekarang tidak perlu nunggu dibalas chat pemilik lagi.",
      initials: "DA",
      name: "Dewi A.",
      role: "Penyewa kamar, Yogyakarta",
    },
  ];

  return (
    <section className="py-24 max-[720px]:py-16">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-[640px]">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-landing-teal font-semibold">Cerita Pengguna</span>
          <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-landing-navy-deep mt-2.5">
            Dipakai pemilik kos dan penyewa setiap hari
          </h2>
        </div>

        <div className="mt-11 grid grid-cols-2 max-[760px]:grid-cols-1 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-landing-paper border border-landing-line rounded-4xl p-7">
              <p className="text-[16px] text-landing-ink leading-[1.6]">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-5">
                <div className="w-[38px] h-[38px] rounded-full bg-landing-navy text-white flex items-center justify-center font-display font-bold text-[14px]">
                  {t.initials}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-landing-ink">{t.name}</div>
                  <div className="text-[12.5px] text-landing-ink-soft">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
