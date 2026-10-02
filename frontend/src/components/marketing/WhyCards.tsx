import { BadgeCheck, Lock } from "lucide-react";
import Reveal from "./Reveal";

/** "Why it matters": three claims, each with a small proof drawing. */
export default function WhyCards() {
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      <Reveal as="li" index={0} className="mk-card flex flex-col p-2">
        <div className="rounded-[14px] bg-[var(--mk-paper)] p-5" aria-hidden="true">
          <PriceProof />
        </div>
        <div className="p-4 pt-5">
          <p className="text-[0.875rem] text-[var(--mk-muted)]">The price</p>
          <p className="mt-1 text-[1.25rem] font-[620] tracking-[-0.02em]">The total you see is the total you pay.</p>
          <p className="mk-body mt-2">
            Every fee is shown before you pay, never added after. The number at checkout is the
            number on your receipt.
          </p>
        </div>
      </Reveal>
      <Reveal as="li" index={1} className="mk-card flex flex-col p-2">
        <div className="rounded-[14px] bg-[var(--mk-paper)] p-5" aria-hidden="true">
          <HoldProof />
        </div>
        <div className="p-4 pt-5">
          <p className="text-[0.875rem] text-[var(--mk-muted)]">The money</p>
          <p className="mt-1 text-[1.25rem] font-[620] tracking-[-0.02em]">Held until your stay is done.</p>
          <p className="mk-body mt-2">
            Your payment sits in escrow from booking to checkout. If the place is not what was
            listed, the host has not been paid yet.
          </p>
        </div>
      </Reveal>
      <Reveal as="li" index={2} className="mk-card flex flex-col p-2">
        <div className="rounded-[14px] bg-[var(--mk-paper)] p-5" aria-hidden="true">
          <StayProof />
        </div>
        <div className="p-4 pt-5">
          <p className="text-[0.875rem] text-[var(--mk-muted)]">The stay</p>
          <p className="mt-1 text-[1.25rem] font-[620] tracking-[-0.02em]">What you saw is what you get.</p>
          <p className="mk-body mt-2">
            Hosts are verified before they list, and reviews only come from guests who actually
            stayed and paid.
          </p>
        </div>
      </Reveal>
    </ul>
  );
}

function PriceProof() {
  const rows = [
    ["On the listing", "₦340,000"],
    ["At checkout", "₦340,000"],
    ["On your receipt", "₦340,000"],
  ];
  return (
    <div className="flex h-[8.5rem] flex-col justify-center gap-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between rounded-[10px] bg-[var(--mk-surface)] px-3.5 py-2 shadow-[var(--mk-shadow-border)]">
          <span className="text-[0.8125rem] text-[var(--mk-muted)]">{k}</span>
          <span className="mk-num text-[0.875rem] font-[600]">{v}</span>
        </div>
      ))}
    </div>
  );
}

function HoldProof() {
  const steps = ["Paid", "Held", "Checked out", "Released"];
  return (
    <div className="flex h-[8.5rem] flex-col justify-center">
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
              style={{
                background: i === 1 ? "var(--mk-brass)" : i < 1 ? "var(--mk-lagoon)" : "var(--mk-surface)",
                color: i <= 1 ? "#fff" : "var(--mk-faint)",
                boxShadow: i > 1 ? "var(--mk-shadow-border)" : "none",
              }}
            >
              {i === 1 ? <Lock size={14} strokeWidth={2} /> : <span className="mk-num text-[0.75rem] font-[600]">{i + 1}</span>}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px flex-1 bg-[var(--mk-line)]" />}
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[0.75rem] text-[var(--mk-muted)]">
        {steps.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function StayProof() {
  return (
    <div className="flex h-[8.5rem] items-center gap-4">
      <div className="h-full w-[42%] rounded-[10px] bg-[linear-gradient(160deg,#cfe0d9,#9fbfb3)]" />
      <div className="flex flex-1 flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--mk-surface)] px-2.5 py-1 text-[0.75rem] font-[560] shadow-[var(--mk-shadow-border)]">
          <BadgeCheck size={14} strokeWidth={2} className="text-[var(--mk-signal)]" />
          Verified host
        </span>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--mk-surface)] px-2.5 py-1 text-[0.75rem] font-[560] shadow-[var(--mk-shadow-border)]">
          Reviews from paid stays only
        </span>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--mk-surface)] px-2.5 py-1 text-[0.75rem] font-[560] shadow-[var(--mk-shadow-border)]">
          Photos checked
        </span>
      </div>
    </div>
  );
}
