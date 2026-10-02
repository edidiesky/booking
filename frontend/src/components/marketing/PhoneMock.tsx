import { Lock, MapPin, MessageCircle } from "lucide-react";
import { BRAND } from "@/config/brand";

/** App screen drawn in HTML/CSS: crisp at any DPR, themable, translatable. */
export default function PhoneMock() {
  return (
    <div aria-hidden="true" className="mx-auto w-[300px] rounded-[48px] bg-[var(--mk-ink)] p-[10px] shadow-[var(--mk-shadow-float)]">
      <div className="overflow-hidden rounded-[38px] bg-[var(--mk-paper)]">
        <div className="flex h-9 items-center justify-between px-6 text-[0.75rem] font-[600]">
          <span className="mk-num">9:41</span>
          <span className="h-5 w-20 rounded-full bg-[var(--mk-ink)]" />
          <span className="mk-num">82%</span>
        </div>
        <div className="flex flex-col gap-3 px-4 pb-5 pt-2">
          <p className="text-[0.75rem] text-[var(--mk-muted)]">Your stay</p>
          <div className="rounded-[18px] bg-[var(--mk-surface)] p-1.5 shadow-[var(--mk-shadow-border)]">
            <div className="h-28 rounded-[12px] bg-[linear-gradient(150deg,#d6e6df,#8db3a5)]" />
            <div className="px-2.5 pb-2 pt-3">
              <p className="text-[0.9375rem] font-[600]">Two-bed apartment</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[0.75rem] text-[var(--mk-muted)]">
                <MapPin size={12} strokeWidth={2} /> Lekki Phase 1, Lagos
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[0.75rem]">
                <div className="rounded-[10px] bg-[var(--mk-paper)] px-2.5 py-2">
                  <p className="text-[var(--mk-faint)]">Check-in</p>
                  <p className="mk-num font-[600]">Fri, 14:00</p>
                </div>
                <div className="rounded-[10px] bg-[var(--mk-paper)] px-2.5 py-2">
                  <p className="text-[var(--mk-faint)]">Check-out</p>
                  <p className="mk-num font-[600]">Sun, 12:00</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[14px] bg-[var(--mk-brass-tint)] px-3.5 py-3">
            <span className="inline-flex items-center gap-1.5 text-[0.75rem] font-[560] text-[#6b4d16]">
              <Lock size={13} strokeWidth={2} /> Held by {BRAND.name}
            </span>
            <span className="mk-num text-[0.8125rem] font-[650] text-[#4d370f]">₦340,000</span>
          </div>
          <div className="rounded-[14px] bg-[var(--mk-surface)] px-3.5 py-3 shadow-[var(--mk-shadow-border)]">
            <p className="text-[0.75rem] text-[var(--mk-faint)]">Host</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[0.875rem] font-[600]">Adaeze O.</p>
              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--mk-lagoon)] px-3 text-[0.75rem] font-[560] text-white">
                <MessageCircle size={13} strokeWidth={2} /> Message
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
