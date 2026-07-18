import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Bagaimana penyewa menemukan properti saya?",
    a: "Setiap properti punya kode undangan unik. Bagikan kodenya ke calon penyewa, dan mereka bisa langsung melihat tipe kamar serta harga yang tersedia tanpa perlu didaftarkan manual.",
  },
  {
    q: "Bisakah saya mengelola lebih dari satu properti?",
    a: "Bisa. KOSTEL dirancang untuk pemilik dengan satu kos maupun pengelola dengan puluhan properti sekaligus, masing-masing dengan kamar dan tipe harga sendiri.",
  },
  {
    q: "Apakah ada aplikasi mobile?",
    a: "KOSTEL adalah aplikasi web responsif yang bisa dibuka dari browser di ponsel maupun desktop, jadi tidak perlu instalasi terpisah untuk pemilik maupun penyewa.",
  },
  {
    q: "Bagaimana pembayaran diproses?",
    a: "Penyewa membayar sewa prorata dan deposit secara online lewat aplikasi, dan pemilik bisa langsung melihat status pembayaran serta tunggakan di dashboard.",
  },
  {
    q: "Bisakah saya mengekspor data keuangan?",
    a: "Ya, laporan pemasukan, pengeluaran, dan profitabilitas per kamar bisa diekspor untuk kebutuhan pembukuan atau pelaporan pajak.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 max-[720px]:py-16" id="faq">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-[640px]">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-landing-teal font-semibold">FAQ</span>
          <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-landing-navy-deep mt-2.5">
            Pertanyaan yang sering ditanyakan
          </h2>
        </div>

        <div className="mt-10 max-w-[760px]">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="border-b border-landing-line py-5">
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="w-full flex justify-between items-center cursor-pointer bg-transparent border-none text-left font-semibold text-[16px] text-landing-navy-deep"
                >
                  <span>{item.q}</span>
                  <span
                    className="font-mono text-[20px] text-landing-teal shrink-0 ml-4 transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3.5 text-landing-ink-soft text-[14.5px] max-w-[640px] leading-[1.6]">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
