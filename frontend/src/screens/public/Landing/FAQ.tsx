import { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../../components/ui/collapsible";
import AnimateTextWord from "@/components/common/AnimateTextWord";

const FAQS = [
  {
    question: "What can I list on this platform?",
    answer:
      "Shortlets, hotels, and guesthouses. Each property type has its own booking flow, room types, and availability rules, set up once when you add the property.",
  },
  {
    question: "How does payment and payout work?",
    answer:
      "Guests pay upfront through Paystack or Flutterwave. Funds sit in escrow until the stay completes, then release to you automatically, no manual reconciliation.",
  },
  {
    question: "Can my team have different access levels?",
    answer:
      "Yes. Invite staff with custom roles scoped to exactly what they need, not just a blanket admin or staff toggle.",
  },
  {
    question: "What happens if a guest cancels?",
    answer:
      "Refunds follow the cancellation policy you set per property. Escrow handles partial or full refunds automatically based on that policy.",
  },
  {
    question: "How fast do I get notified of bookings?",
    answer:
      "Real-time, in-app and via email or SMS the moment a booking, check-in, or check-out happens. No polling, no delay.",
  },
  {
    question: "Do you take a cut of every booking?",
    answer:
      "A platform fee applies per booking, set per tenant. You see the exact percentage before you list, no surprise deductions at payout.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className="w-full py-20"
      style={{ backgroundColor: "var(--color-canvas)" }}
    >
      <div
        className="mx-auto px-6 lg:px-8 grid lg:grid-cols-[200px_1fr] gap-12"
        style={{ maxWidth: "1280px" }}
      >
        <div>
          <p
            className="text-xs uppercase bold sticky"
            style={{ color: "var(--color-hint-of-grey)", top: "24px" }}
          >
            FAQs
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:gap-8">
          <h2
            className="text-4xl lg:text-6xl mt-2 max-w-xl text-start "
            style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}
          >
            <AnimateTextWord type="bigtext_Center">
              Not guesswork. Real answers here.
            </AnimateTextWord>
          </h2>

          <div>
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <Collapsible
                  key={faq.question}
                  open={isOpen}
                  onOpenChange={() => setOpenIndex(isOpen ? null : i)}
                  className="border-t last:border-b"
                  style={{ borderColor: "#e8e6e3" }}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className="w-full flex items-center justify-between text-left py-6"
                      style={{ color: "var(--color-ink)" }}
                    >
                      <span className="text-lg lg:text-xl">{faq.question}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 ml-4"
                      >
                        <Plus size={20} />
                      </motion.span>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent asChild forceMount>
                    <motion.div
                      initial={false}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <p
                        className="pb-6 text-base leading-relaxed max-w-2xl"
                        style={{ color: "var(--color-muted-stone)" }}
                      >
                        {faq.answer}
                      </p>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
