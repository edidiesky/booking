import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import Hero from "./Hero";
import Listing from "./Listings";
import About from "./About";
import Expert from "./Expert";
import FAQ from "./FAQ";
import SmoothScroll from "@/constants/SmoothScroll";
import Testimonials from "./Testimonials";

export default function Landing() {
  return (
    <SmoothScroll>
      <Header />
      <main className="flex-1 flex-col gap-14">
        <Hero />
        <About />
        <Listing />
        <Expert />
        <Testimonials/>
        <FAQ />
      </main>

      <Footer />
    </SmoothScroll>
  );
}
