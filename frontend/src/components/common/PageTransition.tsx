import { motion } from "framer-motion";
import { LargeSlideup } from "@/constants/framer";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      custom={1}
      initial="initial"
      animate="animate"
      variants={LargeSlideup}
    >
      {children}
    </motion.div>
  );
}