import { motion }          from "framer-motion";
import Header              from "@/components/common/Header";
import Footer              from "@/components/common/Footer";
import Hero from "./Hero";
import Listing from "./Listings";
import About from "./About";
import Expert from "./Expert";
import Blog from "./Blog";

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />

      <main className="flex-1 flex-col gap-14">
        <Hero/>
        <About/>
        <Listing/>
        
        <Expert/>
        <Blog/>
      </main>

      <Footer />
    </motion.div>
  );
}