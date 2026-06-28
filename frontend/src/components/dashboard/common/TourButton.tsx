import { HelpCircle }          from "lucide-react";
import { useDashboardTour }    from "@/hooks/useDashboardTour";

export default function TourButton() {
  const { startTour } = useDashboardTour();
  return (
    <button
      onClick={() => startTour(true)}
      title="Take a tour"
      className="fixed bottom-6 right-6 z-[9999] w-11 h-11 rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
    >
      <HelpCircle size={20} />
    </button>
  );
}