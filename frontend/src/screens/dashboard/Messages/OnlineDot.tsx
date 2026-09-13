import { cn } from "@/lib/utils";

interface OnlineDotProps {
  isOnline: boolean;
  className?: string;
}

export function OnlineDot({ isOnline, className }: OnlineDotProps) {
  return (
    <span
      aria-label={isOnline ? "Online" : "Offline"}
      className={cn(
        "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white",
        isOnline ? "bg-[#22c55e]" : "bg-[#c4c6ce]",
        className,
      )}
    />
  );
}