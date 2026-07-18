export default function FinanceSection() {
  return (
    <section className="py-24 max-[720px]:py-16" id="keuangan">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-[640px]">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-landing-teal font-semibold">Kecerdasan Finansial</span>
          <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-landing-navy-deep mt-2.5">
            Untung-rugi per kamar, bukan cuma total pemasukan
          </h2>
          <p className="mt-3.5 text-landing-ink-soft text-[16.5px]">
            Kebanyakan pemilik tahu total uang masuk. Lebih sedikit yang tahu kamar mana yang sebenarnya paling menguntungkan setelah biaya perawatan dan listrik dihitung.
          </p>
        </div>

        <div className="bg-landing-paper border border-landing-line rounded-[20px] p-9 mt-12 grid grid-cols-2 max-[820px]:grid-cols-1 gap-10 items-center">
          <div className="font-mono text-[13px]">
            <div className="flex justify-between py-2.5 border-b border-dashed border-landing-line">
              <span>Sewa kamar 101–108</span>
              <span className="text-landing-success">+ Rp 18.400.000</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-dashed border-landing-line">
              <span>Listrik & air</span>
              <span className="text-landing-error">− Rp 2.100.000</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-dashed border-landing-line">
              <span>Perawatan & kebersihan</span>
              <span className="text-landing-error">− Rp 950.000</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-dashed border-landing-line">
              <span>Perlengkapan</span>
              <span className="text-landing-error">− Rp 340.000</span>
            </div>
            <div className="flex justify-between pt-3.5 font-bold text-landing-navy-deep">
              <span>Laba bersih bulan ini</span>
              <span className="text-landing-success">Rp 15.010.000</span>
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-landing-ink-soft mb-3">Margin per kamar (contoh)</p>
            <div className="flex items-end gap-2 h-[150px]" aria-hidden="true">
              <div className="flex-1 rounded-tl-[5px] rounded-tr-[5px] rounded-br-[2px] rounded-bl-[2px]" style={{ height: "60%", background: "linear-gradient(180deg, var(--color-landing-teal), var(--color-landing-navy))" }} />
              <div className="flex-1 rounded-tl-[5px] rounded-tr-[5px] rounded-br-[2px] rounded-bl-[2px]" style={{ height: "85%", background: "linear-gradient(180deg, var(--color-landing-teal), var(--color-landing-navy))" }} />
              <div className="flex-1 rounded-tl-[5px] rounded-tr-[5px] rounded-br-[2px] rounded-bl-[2px]" style={{ height: "40%", background: "linear-gradient(180deg, var(--color-landing-teal), var(--color-landing-navy))" }} />
              <div className="flex-1 rounded-tl-[5px] rounded-tr-[5px] rounded-br-[2px] rounded-bl-[2px]" style={{ height: "95%", background: "linear-gradient(180deg, var(--color-landing-teal), var(--color-landing-navy))" }} />
              <div className="flex-1 rounded-tl-[5px] rounded-tr-[5px] rounded-br-[2px] rounded-bl-[2px]" style={{ height: "70%", background: "linear-gradient(180deg, var(--color-landing-teal), var(--color-landing-navy))" }} />
              <div className="flex-1 rounded-tl-[5px] rounded-tr-[5px] rounded-br-[2px] rounded-bl-[2px]" style={{ height: "55%", background: "linear-gradient(180deg, var(--color-landing-teal), var(--color-landing-navy))" }} />
            </div>
            <p className="mt-3.5 text-[13px] text-landing-ink-soft">Kategori pengeluaran: perawatan, utilitas, renovasi, kebersihan, perlengkapan.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
