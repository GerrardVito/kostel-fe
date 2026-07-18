export default function ProblemSection() {
  return (
    <section className="bg-landing-navy-deep text-[#eaf1f5] py-24 max-[720px]:py-16">
      <div className="max-w-[1160px] mx-auto px-6">
        <span className="font-mono text-[12px] tracking-[0.08em] uppercase font-semibold" style={{ color: "#5fb3a0" }}>
          Sebelum KOSTEL
        </span>
        <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-white mt-2.5">
          Rasanya familiar?
        </h2>
        <p className="text-[#a9c0cd] max-w-[560px] mt-3.5 text-[17px]">
          Kebanyakan pemilik kos masih menjalankan bisnis yang cukup besar lewat alat yang terlalu kecil untuknya.
        </p>
        <div className="mt-12 grid gap-px rounded-4xl overflow-hidden" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", background: "rgba(255,255,255,0.08)" }}>
          <div className="bg-[rgba(255,255,255,0.04)] p-[26px]">
            <span className="font-mono text-[12px] block mb-3.5" style={{ color: "#5fb3a0" }}>01</span>
            <p className="text-[#cfe0e6] text-[14.5px] leading-[1.55]">Catatan sewa dan pengeluaran tersebar di spreadsheet, buku tulis, dan struk yang hilang.</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.04)] p-[26px]">
            <span className="font-mono text-[12px] block mb-3.5" style={{ color: "#5fb3a0" }}>02</span>
            <p className="text-[#cfe0e6] text-[14.5px] leading-[1.55]">Puluhan chat WhatsApp per hari hanya untuk menagih, mengingatkan, dan menjawab keluhan yang sama.</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.04)] p-[26px]">
            <span className="font-mono text-[12px] block mb-3.5" style={{ color: "#5fb3a0" }}>03</span>
            <p className="text-[#cfe0e6] text-[14.5px] leading-[1.55]">Tidak tahu kamar mana yang benar-benar untung setelah dikurangi biaya perawatan dan listrik.</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.04)] p-[26px]">
            <span className="font-mono text-[12px] block mb-3.5" style={{ color: "#5fb3a0" }}>04</span>
            <p className="text-[#cfe0e6] text-[14.5px] leading-[1.55]">Laporan kerusakan ditulis di kertas, lalu terlupakan sampai penyewa komplain lagi.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
