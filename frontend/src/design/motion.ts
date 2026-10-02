/**
 * Motion values. Exact, not approximations.
 * Sources: emil-design-eng (easing curves, duration ceilings),
 * better-ui (press scale 0.96, icon swap, 100ms stagger, bounce 0).
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const DURATION = {
  hover: 0.15,
  popover: 0.2,
  collapse: 0.25,
  drawer: 0.3,
  enter: 0.5,
} as const;

/** Stagger between semantic chunks of an infrequent entrance. */
export const STAGGER = 0.1;

/** Contextual icon swap: scale 0.25 to 1, opacity 0 to 1, blur 4px to 0. */
export const ICON_SWAP = {
  initial: { scale: 0.25, opacity: 0, filter: "blur(4px)" },
  animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
  exit: { scale: 0.25, opacity: 0, filter: "blur(4px)" },
  transition: { type: "spring" as const, duration: 0.3, bounce: 0 },
};

/** Staged section entrance. Small offset, never full height. */
export const RISE = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.enter,
      ease: EASE_OUT,
      delay: i * STAGGER,
    },
  }),
};
