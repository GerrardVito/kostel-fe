import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

type RoomStatus = "s-occupied" | "s-vacant" | "s-maintenance" | "s-urgent";

interface Room {
  n: string;
  s: RoomStatus;
}

const STATUS_LABEL: Record<RoomStatus, string> = {
  "s-occupied": "Terisi",
  "s-vacant": "Kosong",
  "s-maintenance": "Perbaikan",
  "s-urgent": "Urgent",
};

const STATUS_BG: Record<RoomStatus, string> = {
  "s-occupied": "bg-landing-status-occupied",
  "s-vacant": "bg-landing-status-vacant",
  "s-maintenance": "bg-landing-status-maintenance",
  "s-urgent": "bg-landing-status-urgent",
};

const INITIAL_ROOMS: Room[] = [
  { n: "101", s: "s-occupied" }, { n: "102", s: "s-occupied" }, { n: "103", s: "s-vacant" }, { n: "104", s: "s-occupied" },
  { n: "105", s: "s-occupied" }, { n: "106", s: "s-maintenance" }, { n: "107", s: "s-occupied" }, { n: "108", s: "s-occupied" },
  { n: "109", s: "s-vacant" }, { n: "110", s: "s-occupied" }, { n: "111", s: "s-occupied" }, { n: "112", s: "s-urgent" },
];

function RoomFacade() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    intervalRef.current = setInterval(() => {
      setRooms((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const options: RoomStatus[] = ["s-occupied", "s-occupied", "s-occupied", "s-vacant", "s-maintenance"];
        next[idx] = { ...next[idx], s: options[Math.floor(Math.random() * options.length)] };
        return next;
      });
    }, 3200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const occupied = rooms.filter((r) => r.s === "s-occupied" || r.s === "s-urgent").length;
  const occupancyPct = Math.round((occupied / rooms.length) * 100);

  return (
    <div className="bg-landing-paper border border-landing-line rounded-[20px] p-[22px]" style={{ boxShadow: "0 24px 60px -30px rgba(0,53,95,0.35)" }}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] font-semibold text-landing-ink-soft">Wisma Kenanga — Status Kamar</span>
        <span className="font-mono text-[13px] text-landing-teal font-semibold">{occupancyPct}% terisi</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5" role="img" aria-label="Ilustrasi status kamar kos: sebagian terisi, sebagian kosong, satu dalam perbaikan">
        {rooms.map((room) => (
          <div
            key={room.n}
            className={`aspect-[1/1.15] rounded-[9px] relative p-2 flex flex-col justify-between font-mono text-[11px] text-white overflow-hidden transition-transform duration-300 hover:-translate-y-[3px] ${STATUS_BG[room.s]}`}
          >
            <span className="font-semibold opacity-95">{room.n}</span>
            <span className="text-[9px] uppercase tracking-wide opacity-85">{STATUS_LABEL[room.s]}</span>
            <span className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 55%)" }} />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-[12px] text-landing-ink-soft">
          <span className="w-[9px] h-[9px] rounded-[3px] bg-landing-status-vacant" />Kosong
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-landing-ink-soft">
          <span className="w-[9px] h-[9px] rounded-[3px] bg-landing-status-occupied" />Terisi
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-landing-ink-soft">
          <span className="w-[9px] h-[9px] rounded-[3px] bg-landing-status-maintenance" />Perbaikan
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-landing-ink-soft">
          <span className="w-[9px] h-[9px] rounded-[3px] bg-landing-status-urgent" />Urgent
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            if (prefersReducedMotion) {
              el.textContent = target + suffix;
              return;
            }
            let current = 0;
            const step = Math.max(1, Math.round(target / 30));
            const timer = setInterval(() => {
              current += step;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              el.textContent = current + suffix;
            }, 30);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function Hero() {
  return (
    <section className="py-[72px] pb-10 overflow-hidden" id="top">
      <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-[1.05fr_0.95fr] max-[960px]:grid-cols-1 gap-14 max-[960px]:gap-12 items-center">
        <div>
          <span className="font-mono text-[12px] tracking-[0.08em] uppercase text-landing-teal font-semibold">
            Property Management System · Dibuat untuk Indonesia
          </span>
          <h1 className="font-display text-[clamp(34px,4.6vw,54px)] leading-[1.06] font-extrabold tracking-tight text-landing-navy-deep mt-4">
            Kelola kos dan properti sewa <em className="not-italic text-landing-teal">tanpa buku catatan, tanpa chat berantakan.</em>
          </h1>
          <p className="mt-[22px] text-[18px] text-landing-ink-soft max-w-[520px]">
            KOSTEL menyatukan kamar, penyewa, tagihan, kontrak digital, dan laporan keuangan per kamar dalam satu dashboard — dari aplikasi masuk sampai penyewa check-out.
          </p>
          <div className="flex gap-3.5 mt-8 flex-wrap">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-[26px] py-3.5 rounded-[11px] font-semibold text-[16px] bg-landing-navy text-white hover:bg-landing-navy-deep transition-all hover:-translate-y-px"
            >
              Mulai Gratis
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center justify-center gap-2 px-[26px] py-3.5 rounded-[11px] font-semibold text-[16px] border border-landing-line text-landing-navy-deep hover:bg-white transition-all hover:-translate-y-px"
            >
              Lihat Demo Produk
            </a>
          </div>
          <div className="flex gap-7 mt-9 flex-wrap">
            <div className="text-[13px] text-landing-ink-soft">
              <b className="block font-mono text-[22px] text-landing-navy-deep font-semibold">
                <AnimatedCounter target={50} />
              </b>
              kamar per pemilik, tanpa batas properti
            </div>
            <div className="text-[13px] text-landing-ink-soft">
              <b className="block font-mono text-[22px] text-landing-navy-deep font-semibold">
                <AnimatedCounter target={100} suffix="%" />
              </b>
              proses sewa jadi digital
            </div>
            <div className="text-[13px] text-landing-ink-soft">
              <b className="block font-mono text-[22px] text-landing-navy-deep font-semibold">PostgreSQL</b>
              infrastruktur produksi
            </div>
          </div>
        </div>
        <RoomFacade />
      </div>
    </section>
  );
}
