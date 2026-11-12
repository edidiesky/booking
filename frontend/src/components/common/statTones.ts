import type { StatTone } from "./widgets/statCard.types";

export const statTones: Record<
  StatTone,
  { pill: string; dot: string; meter: string }
> = {
  success: {
    pill: "bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
    meter: "#166534",
  },
  warning: {
    pill: "bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    meter: "#b45309",
  },
  danger: {
    pill: "bg-red-50 text-red-800",
    dot: "bg-red-600",
    meter: "#b12b24",
  },
  neutral: {
    pill: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    meter: "#66798b",
  },
  info: {
    pill: "bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
    meter: "#001f3d",
  },
};