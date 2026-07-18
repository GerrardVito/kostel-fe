export default function HowItWorks() {
  const steps = [
    { num: "1", title: "Masukkan kode undangan", desc: "Penyewa mendapat kode dari pemilik dan menemukan properti dalam hitungan detik." },
    { num: "2", title: "Pilih tipe kamar & ajukan", desc: "Lihat harga dan ukuran, lalu kirim data diri, pekerjaan, dan alasan menyewa." },
    { num: "3", title: "Lacak status pengajuan", desc: "Status berubah real-time — tidak perlu menanyakan lewat chat apakah sudah diterima." },
    { num: "4", title: "Bayar & tanda tangan kontrak", desc: "Bayar sewa prorata plus deposit, lalu tanda tangani kontrak langsung di layar." },
    { num: "5", title: "Check-in & akses dashboard", desc: "Selesaikan daftar periksa check-in, lalu langsung punya akses ke dashboard penyewa." },
  ];

  return (
    <section className="py-24 max-[720px]:py-16 bg-landing-bg-alt" id="cara-kerja">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-[640px]">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-landing-teal font-semibold">Alur Penyewa</span>
          <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-landing-navy-deep mt-2.5">
            Dari kode undangan sampai pindah masuk
          </h2>
          <p className="mt-3.5 text-landing-ink-soft text-[16.5px]">
            Ini benar-benar berurutan — setiap tahap membuka tahap berikutnya di aplikasi, jadi penyewa selalu tahu harus ngapain.
          </p>
        </div>

        <div className="mt-12 relative pl-7 border-l-2 border-landing-line">
          {steps.map((step) => (
            <div key={step.num} className="relative pb-10 last:pb-0">
              <div
                className="absolute -left-[42px] top-0 w-7 h-7 rounded-full bg-landing-navy text-white font-mono text-[12px] font-semibold flex items-center justify-center"
              >
                {step.num}
              </div>
              <h3 className="text-[17px] font-bold text-landing-navy-deep">{step.title}</h3>
              <p className="mt-1.5 text-landing-ink-soft text-[14.5px] max-w-[520px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
