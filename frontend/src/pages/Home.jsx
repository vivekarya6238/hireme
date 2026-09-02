import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import CategoryPreview from "../components/CategoryPreview";
import TrustSection from "../components/TrustSection";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ScrollReveal>
          <HowItWorks />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <CategoryPreview />
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <TrustSection />
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
}

export default Home;