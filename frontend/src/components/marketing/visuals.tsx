import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Lock, MapPin } from "lucide-react";
import { BRAND } from "@/config/brand";
import { EASE_OUT } from "@/design/motion";

/** Abstract Lagos map with verified host pins. Decorative. */
export function CityMapVisual() {
  const pins = [
    { x: 92, y: 70, label: "Ikeja" },
    { x: 150, y: 128, label: "Yaba" },
    { x: 214, y: 182, label: "Ikoyi" },
    { x: 178, y: 216, label: "Victoria Island" },
    { x: 318, y: 206, label: "Lekki" },
  ];
  return (
    <div aria-hidden="true" className="mk-card overflow-hidden p-2">
      <div className="rounded-[14px] bg-[var(--mk-lagoon-tint)]">
        <svg viewBox="0 0 400 280" className="block h-auto w-full">
          <path
            d="M0 196c40-6 70 10 110 6s58-22 96-14 54 30 96 26 64-16 98-10v76H0Z"
            fill="#c9ddd6"
          />
          <path d="M120 236c30-10 70-8 110-2" stroke="#b5cfc6" strokeWidth="2" fill="none" />
          <path
            d="M20 40 140 110M140 110l60 70M200 180l140 26M60 150l80-40M260 60l-60 120"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.9"
          />
          {pins.map((p) => (
            <g key={p.label} transform={`translate(${p.x} ${p.y})`}>
              <circle r="15" fill="var(--mk-lagoon)" opacity="0.12" />
              <circle r="6" fill="var(--mk-lagoon)" />
              <text
                x="12"
                y="-9"
                fontSize="11.5"
                fontWeight="600"
                fill="var(--mk-ink)"
                style={{ fontFamily: "inherit" }}
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-between px-3 py-3">
        <span className="inline-flex items-center gap-1.5 text-[0.875rem] font-[560]">
          <MapPin size={16} strokeWidth={1.75} className="text-[var(--mk-lagoon)]" />
          Lagos
        </span>
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--mk-muted)]">
          <BadgeCheck size={16} strokeWidth={1.75} className="text-[var(--mk-signal)]" />
          Every pin is a verified host
        </span>
      </div>
    </div>
  );
}

/** Escrow card: Paid, Held, Released. The track fills once on view. */
export function EscrowVisual({ amount = "₦340,000" }: { amount?: string }) {
  const reduce = useReducedMotion();
  const states = ["Paid", "Held", "Released"];
  return (
    <div aria-hidden="true" className="mk-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[0.8125rem] text-[var(--mk-faint)]">Your payment</p>
          <p className="mk-num mt-1 text-[2rem] font-[650] tracking-[-0.03em]">{amount}</p>
        </div>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--mk-brass-tint)] px-3 text-[0.8125rem] font-[560] text-[#6b4d16]">
          <Lock size={14} strokeWidth={2} />
          Held by {BRAND.name}
        </span>
      </div>

      <div className="mt-7">
        <div className="relative h-1.5 rounded-full bg-[var(--mk-line)]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--mk-brass)]"
            initial={reduce ? false : { width: "0%" }}
            whileInView={{ width: "50%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.2 }}
            style={reduce ? { width: "50%" } : undefined}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 text-[0.8125rem]">
          {states.map((s, i) => (
            <span
              key={s}
              className={`${i === 1 ? "text-center font-[600] text-[var(--mk-ink)]" : "text-[var(--mk-faint)]"} ${
                i === 2 ? "text-right" : ""
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <dl className="mt-6 divide-y divide-[var(--mk-line)] text-[0.875rem]">
        {[
          ["Guest paid", "Wed 13:02"],
          ["Host can see it", "Yes, but cannot withdraw"],
          ["Released", "When the stay completes"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5">
            <dt className="text-[var(--mk-muted)]">{k}</dt>
            <dd className="text-right font-[560]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Host-side status card for the Hosts page. */
export function CalendarVisual() {
  const units = ["Studio A", "Studio B", "1 Bed, Fl 2", "2 Bed, Fl 3"];
  const bars: Record<number, [number, number, "booked" | "held"][]> = {
    0: [[0, 3, "booked"], [4, 7, "held"]],
    1: [[1, 5, "booked"]],
    2: [[0, 2, "held"], [3, 6, "booked"]],
    3: [[2, 7, "booked"]],
  };
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div aria-hidden="true" className="mk-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[0.9375rem] font-[600]">This week, Lekki</p>
        <p className="text-[0.8125rem] text-[var(--mk-muted)]">4 units</p>
      </div>
      <div className="mt-4 grid grid-cols-[84px_repeat(7,minmax(0,1fr))] gap-y-2 text-[0.75rem]">
        <span />
        {days.map((d, i) => (
          <span key={i} className="text-center text-[var(--mk-faint)]">
            {d}
          </span>
        ))}
        {units.map((u, row) => (
          <div key={u} className="contents">
            <span className="truncate py-1.5 text-[var(--mk-muted)]">{u}</span>
            <div className="relative col-span-7 h-7 rounded-[8px] bg-[var(--mk-paper)]">
              {bars[row].map(([s, e, kind], i) => (
                <span
                  key={i}
                  className="absolute inset-y-1 rounded-[6px]"
                  style={{
                    left: `calc(${(s / 7) * 100}% + 2px)`,
                    width: `calc(${((e - s) / 7) * 100}% - 4px)`,
                    background: kind === "booked" ? "var(--mk-lagoon)" : "var(--mk-brass-tint)",
                    boxShadow: kind === "held" ? "inset 0 0 0 1px var(--mk-brass)" : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-[0.75rem] text-[var(--mk-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[var(--mk-lagoon)]" /> Booked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[var(--mk-brass-tint)] ring-1 ring-[var(--mk-brass)]" />
          Awaiting payment
        </span>
      </div>
    </div>
  );
}

/** The host's own booking page on a subdomain. */
export function StorefrontVisual({ handle = "adaeze" }: { handle?: string }) {
  const host = `${handle}.${BRAND.name.toLowerCase()}.ng`;
  return (
    <div aria-hidden="true" className="mk-card overflow-hidden p-2">
      <div className="flex items-center gap-2 rounded-t-[14px] bg-[var(--mk-paper)] px-3 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        </span>
        <span className="mx-auto rounded-full bg-[var(--mk-surface)] px-3 py-1 text-[0.75rem] text-[var(--mk-muted)] shadow-[var(--mk-shadow-border)]">
          {host}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--mk-lagoon)] text-[0.875rem] font-[650] text-white">
            AO
          </span>
          <div>
            <p className="text-[1rem] font-[620]">Adaeze Homes</p>
            <p className="text-[0.8125rem] text-[var(--mk-muted)]">6 apartments in Lekki and Ikoyi</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["#cfe0d9", "#bcd3ca", "#a9c6bb"].map((c) => (
            <div key={c} className="flex flex-col gap-1.5">
              <div className="aspect-[4/3] rounded-[10px]" style={{ background: c }} />
              <span className="h-2 w-4/5 rounded-full bg-black/[0.08]" />
              <span className="h-2 w-1/2 rounded-full bg-black/[0.06]" />
            </div>
          ))}
        </div>
        <span className="inline-flex h-9 w-fit items-center rounded-full bg-[var(--mk-lagoon)] px-4 text-[0.8125rem] font-[560] text-white">
          Check availability
        </span>
      </div>
    </div>
  );
}

/** Team and roles: who can see and do what. */
export function RolesVisual() {
  const people = [
    { n: "Adaeze O.", r: "Owner", scope: "Everything" },
    { n: "Tunde B.", r: "Manager", scope: "Bookings, calendar, guests" },
    { n: "Grace E.", r: "Front desk", scope: "Check-ins only" },
    { n: "Musa K.", r: "Accounts", scope: "Payments and payouts" },
  ];
  return (
    <div aria-hidden="true" className="mk-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[0.9375rem] font-[600]">Team</p>
        <span className="inline-flex h-8 items-center rounded-full px-3 text-[0.8125rem] font-[560] shadow-[var(--mk-shadow-border)]">
          Invite
        </span>
      </div>
      <ul className="mt-3 divide-y divide-[var(--mk-line)]">
        {people.map((p) => (
          <li key={p.n} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-[560]">{p.n}</p>
              <p className="truncate text-[0.8125rem] text-[var(--mk-muted)]">{p.scope}</p>
            </div>
            <span className="rounded-full bg-[var(--mk-lagoon-tint)] px-2.5 py-1 text-[0.75rem] font-[560] text-[var(--mk-lagoon-deep)]">
              {p.r}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Host-side payout ledger. */
export function PayoutVisual() {
  const rows = [
    { ref: "KH-20418", s: "Released", v: "₦340,000", tone: "good" },
    { ref: "KH-20411", s: "Held, checkout Sun", v: "₦180,000", tone: "held" },
    { ref: "KH-20407", s: "Held, checkout Mon", v: "₦500,000", tone: "held" },
    { ref: "KH-20399", s: "Released", v: "₦250,000", tone: "good" },
  ] as const;
  return (
    <div aria-hidden="true" className="mk-card p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[0.8125rem] text-[var(--mk-faint)]">Released this week</p>
          <p className="mk-num mt-1 text-[1.75rem] font-[650] tracking-[-0.03em]">₦590,000</p>
        </div>
        <p className="mk-num text-[0.8125rem] text-[var(--mk-muted)]">₦680,000 held</p>
      </div>
      <ul className="mt-4 divide-y divide-[var(--mk-line)] text-[0.875rem]">
        {rows.map((r) => (
          <li key={r.ref} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5">
            <span className="mk-num text-[var(--mk-muted)]">{r.ref}</span>
            <span
              className="w-fit rounded-full px-2.5 py-0.5 text-[0.75rem] font-[560]"
              style={{
                background: r.tone === "good" ? "var(--mk-lagoon-tint)" : "var(--mk-brass-tint)",
                color: r.tone === "good" ? "var(--mk-lagoon-deep)" : "#6b4d16",
              }}
            >
              {r.s}
            </span>
            <span className="mk-num font-[600]">{r.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
