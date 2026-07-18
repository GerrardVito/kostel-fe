export default function Footer() {
  return (
    <footer className="py-16 pb-8 border-t border-landing-line mt-10">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] max-[760px]:grid-cols-[1fr_1fr] gap-8">
          <div>
            <a href="#top" className="flex items-center gap-2.5 font-display font-extrabold text-[20px] text-landing-navy-deep mb-3.5">
              <span className="w-[30px] h-[30px] rounded-[7px] bg-landing-navy grid grid-cols-2 gap-0.5 p-1" aria-hidden="true">
                <span className="rounded-[1.5px] bg-[#3fd68a]" />
                <span className="rounded-[1.5px] bg-landing-bg" />
                <span className="rounded-[1.5px] bg-landing-bg" />
                <span className="rounded-[1.5px] bg-[#e0a63e]" />
              </span>
              KOSTEL
            </a>
            <p className="text-landing-ink-soft text-[14px] max-w-[280px] mt-2.5">
              Software manajemen kos-kosan dan properti sewa, dibangun untuk pasar Indonesia.
            </p>
          </div>
          <div>
            <h4 className="text-[13px] text-landing-ink-soft uppercase tracking-[0.05em] mb-3.5">Produk</h4>
            <a href="#fitur" className="block text-[14px] text-landing-ink py-1.5 hover:text-landing-teal transition-colors">Fitur</a>
            <a href="#cara-kerja" className="block text-[14px] text-landing-ink py-1.5 hover:text-landing-teal transition-colors">Cara Kerja</a>
            <a href="#harga" className="block text-[14px] text-landing-ink py-1.5 hover:text-landing-teal transition-colors">Harga</a>
          </div>
          <div>
            <h4 className="text-[13px] text-landing-ink-soft uppercase tracking-[0.05em] mb-3.5">Perusahaan</h4>
            <a href="#" className="block text-[14px] text-landing-ink py-1.5 hover:text-landing-teal transition-colors">Tentang Kami</a>
            <a href="#" className="block text-[14px] text-landing-ink py-1.5 hover:text-landing-teal transition-colors">Blog</a>
            <a href="#" className="block text-[14px] text-landing-ink py-1.5 hover:text-landing-teal transition-colors">Kontak</a>
          </div>
          <div>
            <h4 className="text-[13px] text-landing-ink-soft uppercase tracking-[0.05em] mb-3.5">Legal</h4>
            <a href="#" className="block text-[14px] text-landing-ink py-1.5 hover:text-landing-teal transition-colors">Kebijakan Privasi</a>
            <a href="#" className="block text-[14px] text-landing-ink py-1.5 hover:text-landing-teal transition-colors">Syarat & Ketentuan</a>
          </div>
        </div>
        <div className="flex justify-between mt-12 pt-6 border-t border-landing-line text-[13px] text-landing-ink-soft flex-wrap gap-3">
          <span>© 2026 KOSTEL. Dibuat untuk pemilik kos di seluruh Indonesia.</span>
          <span>kostel.id</span>
        </div>
      </div>
    </footer>
  );
}
