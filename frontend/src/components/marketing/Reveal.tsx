import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { RISE } from "@/design/motion";

type Tag = "div" | "section" | "li" | "p" | "h1" | "h2" | "h3" | "span";

interface Props {
  children: ReactNode;
  /** Position in a staged group; delay = index x 100ms. */
  index?: number;
  as?: Tag;
  className?: string;
  /** Animate on mount instead of on entering the viewport (hero only). */
  onMount?: boolean;
}

/**
 * One staged entrance per semantic chunk. Runs once. Reduced motion renders
 * the final state with no animation at all.
 */
export default function Reveal({
  children,
  index = 0,
  as = "div",
  className,
  onMount = false,
}: Props) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }
  const M = motion[as];
  return (
    <M
      className={className}
      variants={RISE}
      custom={index}
      initial="hidden"
      {...(onMount
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: { once: true, margin: "0px 0px -10% 0px" } })}
    >
      {children}
    </M>
  );
}
