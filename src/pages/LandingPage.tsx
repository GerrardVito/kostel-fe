import { Helmet } from "react-helmet-async";
import LandingHeader from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import ProblemSection from "../components/landing/ProblemSection";
import FeatureTabs from "../components/landing/FeatureTabs";
import HowItWorks from "../components/landing/HowItWorks";
import FinanceSection from "../components/landing/FinanceSection";
import BenefitsSection from "../components/landing/BenefitsSection";
import Testimonials from "../components/landing/Testimonials";
import Pricing from "../components/landing/Pricing";
import FAQ from "../components/landing/FAQ";
import CTABand from "../components/landing/CTABand";
import Footer from "../components/landing/Footer";

const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "KOSTEL",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://kostel.id/",
  description:
    "Property management system untuk pemilik kos-kosan dan properti sewa di Indonesia. Kelola kamar, penyewa, tagihan, kontrak digital, dan keuangan per kamar.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
  areaServed: "ID",
});

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>KOSTEL — Software Manajemen Kos & Properti Sewa | Property Management System Indonesia</title>
        <meta
          name="description"
          content="KOSTEL adalah aplikasi manajemen kos-kosan dan properti sewa untuk pemilik di Indonesia: kelola kamar, penyewa, tagihan, dan keuangan per kamar dalam satu dashboard. Coba gratis."
        />
        <meta
          name="keywords"
          content="software manajemen properti indonesia, aplikasi kos-kosan digital, sistem manajemen sewa kamar, property management system indonesia, rental property tracking software, boarding house management"
        />
        <link rel="canonical" href="https://kostel.id/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="KOSTEL" />
        <meta property="og:title" content="KOSTEL — Modern Property Management, Simplified" />
        <meta
          property="og:description"
          content="Kelola properti kos, penyewa, tagihan, dan keuangan dalam satu platform. Dibangun untuk pasar sewa Indonesia."
        />
        <meta property="og:url" content="https://kostel.id/" />
        <meta property="og:locale" content="id_ID" />
        {/* TODO: og-image.png needs to be created (1200×630) before launch */}
        <meta property="og:image" content="https://kostel.id/og-image.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="KOSTEL — Modern Property Management, Simplified" />
        <meta
          name="twitter:description"
          content="Software manajemen kos-kosan & properti sewa untuk pemilik di Indonesia. Kelola kamar, penyewa, dan keuangan dari satu dashboard."
        />

        <script type="application/ld+json">{JSON_LD}</script>
      </Helmet>

      <a href="#main" className="skip-link">Lompat ke konten utama</a>

      <div className="bg-landing-bg text-landing-ink" style={{ lineHeight: 1.5, WebkitFontSmoothing: "antialiased" }}>
        <LandingHeader />
        <main id="main">
          <Hero />
          <ProblemSection />
          <FeatureTabs />
          <HowItWorks />
          <FinanceSection />
          <BenefitsSection />
          <Testimonials />
          <Pricing />
          <FAQ />
          <CTABand />
        </main>
        <Footer />
      </div>
    </>
  );
}
