import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Placeholder copy, replace with your real FAQ content. Structure (Q/A
// list) is the reusable part, the text below is not.
const FAQS = [
  { q: "How do I add a new property?", a: "Go to Properties in the dashboard sidebar and select Add Property." },
  { q: "When do I get paid out for a booking?", a: "Escrow releases automatically once a guest checks out, funds move to your payout account shortly after." },
  { q: "Can I change a booking's cancellation policy?", a: "Yes, under Account > Cancellation Policy, changes apply to new bookings only." },
];

export default function FaqTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-2">
      {FAQS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className="rounded-xl border overflow-hidden" style={{ borderColor: "#e8e6e3" }}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-xs lg:text-[13px]   " style={{ color: "var(--color-ink)" }}>{item.q}</span>
              <ChevronDown
                size={14}
                style={{ color: "#a3a6af", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
              />
            </button>
            {open && (
              <p className="px-4 pb-3 text-xs" style={{ color: "#777b86" }}>{item.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}