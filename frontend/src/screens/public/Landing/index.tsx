import { motion }          from "framer-motion";
import Header              from "@/components/common/Header";
import Footer              from "@/components/common/Footer";
import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";

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
        <Features/>
        <HowItWorks/>
      </main>

      <Footer />
    </motion.div>
  );
}