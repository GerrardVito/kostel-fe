import { useState } from "react";

const OWNER_FEATURES = [
  { icon: "KPI", title: "Dashboard real-time", desc: "Pantau total kamar, kamar kosong, pendapatan bulanan, dan tunggakan dalam satu layar." },
  { icon: "＋", title: "Manajemen properti & kamar", desc: "Buat beberapa properti, atur tipe kamar dan harga, lalu generate kamar satu per satu atau sekaligus." },
  { icon: "✓", title: "Review aplikasi penyewa", desc: "Setujui atau tolak pengajuan, lalu tetapkan kamar ke penyewa yang diterima dalam beberapa klik." },
  { icon: "Rp", title: "Operasional keuangan", desc: "Catat pemasukan dan pengeluaran per kategori, terbitkan tagihan, kirim pengingat pembayaran otomatis." },
  { icon: "⚙", title: "Tiket perbaikan", desc: "Lacak laporan kerusakan dari pending, diproses, sampai selesai — lengkap dengan riwayatnya." },
  { icon: "⎘", title: "Jadwal inspeksi kamar", desc: "Jadwalkan inspeksi berkala dengan daftar periksa yang bisa disesuaikan per tipe kamar." },
];

const TENANT_FEATURES = [
  { icon: "#", title: "Cari properti pakai kode undangan", desc: "Masukkan kode dari pemilik, lihat tipe kamar dan harga yang tersedia, lalu ajukan langsung." },
  { icon: "✎", title: "Kontrak & tanda tangan digital", desc: "Tanda tangani kontrak sewa langsung dari layar — tanpa cetak, tanpa scan, tanpa antre." },
  { icon: "Rp", title: "Bayar tagihan online", desc: "Bayar satu per satu atau sekaligus, dan lihat riwayat pembayaran kapan saja." },
  { icon: "!", title: "Laporan perbaikan cepat", desc: "Ajukan permintaan perbaikan lengkap dengan tingkat urgensi, tanpa perlu chat pemilik." },
  { icon: "Rp", title: "Kelola deposit", desc: "Lihat rincian potongan deposit dan ajukan banding langsung dari aplikasi jika keberatan." },
  { icon: "→", title: "Check-out cepat", desc: "Selesaikan proses keluar kos tanpa bolak-balik menghubungi pemilik untuk konfirmasi." },
];

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState<"owner" | "tenant">("owner");

  const features = activeTab === "owner" ? OWNER_FEATURES : TENANT_FEATURES;

  return (
    <section className="py-24 max-[720px]:py-16" id="fitur">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-[640px]">
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-landing-teal font-semibold">Fitur</span>
          <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-tight text-landing-navy-deep mt-2.5">
            Satu dashboard, dua peran
          </h2>
          <p className="mt-3.5 text-landing-ink-soft text-[16.5px]">
            Pemilik dan penyewa memakai aplikasi yang sama — dengan tampilan yang dirancang untuk pekerjaan masing-masing, sehingga komunikasi bolak-balik jadi jauh lebih sedikit.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2.5 mt-10 mb-8 border-b border-landing-line" role="tablist" aria-label="Fitur berdasarkan peran">
          <button
            role="tab"
            aria-selected={activeTab === "owner"}
            aria-controls="panel-owner"
            tabIndex={activeTab === "owner" ? 0 : -1}
            onClick={() => setActiveTab("owner")}
            className={`pb-3.5 px-1 mr-7 font-semibold text-[15px] border-b-2 cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 transition-colors ${
              activeTab === "owner" ? "text-landing-navy-deep border-landing-teal" : "text-landing-ink-soft border-transparent"
            }`}
          >
            Untuk Pemilik
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "tenant"}
            aria-controls="panel-tenant"
            tabIndex={activeTab === "tenant" ? 0 : -1}
            onClick={() => setActiveTab("tenant")}
            className={`pb-3.5 px-1 font-semibold text-[15px] border-b-2 cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 transition-colors ${
              activeTab === "tenant" ? "text-landing-navy-deep border-landing-teal" : "text-landing-ink-soft border-transparent"
            }`}
          >
            Untuk Penyewa
          </button>
        </div>

        {/* Panels */}
        <div
          id={activeTab === "owner" ? "panel-owner" : "panel-tenant"}
          role="tabpanel"
          aria-labelledby={activeTab === "owner" ? "tab-owner" : "tab-tenant"}
          className="grid grid-cols-3 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1 gap-[18px]"
        >
          {features.map((f, i) => (
            <div key={`${activeTab}-${i}`} className="bg-landing-paper border border-landing-line rounded-[14px] p-[22px]">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-landing-bg-alt flex items-center justify-center mb-4 text-landing-teal font-bold font-mono text-[13px]">
                {f.icon}
              </div>
              <h3 className="text-[15.5px] font-bold text-landing-navy-deep">{f.title}</h3>
              <p className="mt-2 text-[13.8px] text-landing-ink-soft leading-[1.55]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
