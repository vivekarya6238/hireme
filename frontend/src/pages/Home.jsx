import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import CategoryPreview from "../components/CategoryPreview";
import TrustSection from "../components/TrustSection";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <CategoryPreview />
        <TrustSection />
      </main>
      <Footer />
    </div>
  );
}

export default Home;