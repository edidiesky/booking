import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { slideup, LargeSlideup } from "@/constants/framer";

type Props = {
  children: React.ReactNode;
  type?: "bigtext" | "bigtext_Center";
};

export default function AnimateTextWord({ children, type }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    margin: "0px 100px -120px 0px",
    once: true,
  });

  const text = typeof children === "string" ? children : "";
  const variant = type === "bigtext" || type === "bigtext_Center" ? LargeSlideup : slideup;
  const wrapperClass =
    type === "bigtext_Center"
      ? "flex lg:inline-block gap-[4px] flex-wrap w-full items-center lg:space-x-[10px] lg:items-center relative"
      : type === "bigtext"
      ? "flex gap-x-[6px] gap-y-[5px] flex-wrap w-full items-center relative"
      : "flex gap-x-[5px] gap-y-[2px] flex-wrap w-full items-center relative";

  return (
    <span ref={ref} className={wrapperClass}>
      {text.split(" ").map((word, index) => (
        <div key={index} className="inline-flex hide relative">
          <motion.span
            variants={variant}
            custom={index}
            initial="initial"
            animate={inView ? "animate" : "exit"}
          >
            {word === " " ? "\u00A0" : word}
          </motion.span>
        </div>
      ))}
    </span>
  );
}