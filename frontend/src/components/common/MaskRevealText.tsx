import { motion } from "framer-motion";
import type { ElementType, ReactNode } from "react";

interface Props {
  children:  ReactNode;
  as?:       ElementType;
  delay?:    number;
  duration?: number;
  className?: string;
}

export default function MaskRevealText({ children, as: Tag = "div", delay = 0, duration = 0.7, className = "" }: Props) {
  return (
    <Tag className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </Tag>
  );
}