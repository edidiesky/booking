import { useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { BRAND } from "@/config/brand";
import { useCreateLeadMutation, type LeadKind } from "@/redux/services/leadApi";
import { EASE_OUT } from "@/design/motion";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("That does not look like an email address."),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  units: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

type Fields = z.infer<typeof schema>;
type Errors = Partial<Record<keyof Fields, string>>;

interface Props {
  kind: LeadKind;
  submitLabel: string;
  successTitle: string;
  successBody: string;
}

/**
 * Four states, each with its own words: invalid, sending, sent, failed.
 * Failure always offers a working path (email) instead of a dead end.
 */
export default function LeadForm({ kind, submitLabel, successTitle, successBody }: Props) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const successRef = useRef<HTMLDivElement>(null);
  const fallbackEmail = kind === "host_interest" ? BRAND.hostsEmail : BRAND.supportEmail;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const raw = Object.fromEntries(form.entries()) as Record<string, string>;
    const parsed = schema.safeParse(raw);
    if (parsed.success && kind === "contact" && !parsed.data.message) {
      setErrors({ message: "Tell us what you need help with." });
      e.currentTarget.querySelector<HTMLElement>('[name="message"]')?.focus();
      return;
    }
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Fields;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = Object.keys(next)[0];
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    setFailed(false);
    const d = parsed.data;
    try {
      await createLead({
        kind,
        name: d.name,
        email: d.email,
        phone: d.phone || undefined,
        city: d.city || undefined,
        units: d.units ? Number(d.units) || undefined : undefined,
        message: d.message || undefined,
        website: raw.website || undefined,
      }).unwrap();
      setSent(true);
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setFailed(true);
    }
  };

  if (sent) {
    return (
      <motion.div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="mk-card flex flex-col items-start gap-3 p-8 outline-none"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
      >
        <CheckCircle2 size={28} strokeWidth={1.75} className="text-[var(--mk-signal)]" />
        <p className="text-[1.375rem] font-[620] tracking-[-0.02em]">{successTitle}</p>
        <p className="mk-body">{successBody}</p>
      </motion.div>
    );
  }

  const field = (name: keyof Fields, label: string, opts: { type?: string; optional?: boolean; autoComplete?: string; inputMode?: "numeric" | "tel" | "email" } = {}) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-${name}`} className="text-[0.875rem] font-[560]">
        {label}
        {opts.optional && <span className="font-[400] text-[var(--mk-faint)]"> (optional)</span>}
      </label>
      <input
        id={`${id}-${name}`}
        name={name}
        type={opts.type ?? "text"}
        autoComplete={opts.autoComplete}
        inputMode={opts.inputMode}
        className="mk-field"
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${id}-${name}-err` : undefined}
      />
      {errors[name] && (
        <p id={`${id}-${name}-err`} className="text-[0.8125rem] text-[#a2392f]">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form noValidate onSubmit={onSubmit} className="mk-card flex flex-col gap-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name", "Full name", { autoComplete: "name" })}
        {field("email", "Email", { type: "email", autoComplete: "email", inputMode: "email" })}
        {field("phone", "Phone", { type: "tel", optional: true, autoComplete: "tel", inputMode: "tel" })}
        {kind === "host_interest"
          ? field("units", "How many units", { optional: true, inputMode: "numeric" })
          : field("city", "City", { optional: true, autoComplete: "address-level2" })}
      </div>
      {kind === "host_interest" && field("city", "Where are your properties", { optional: true })}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-message`} className="text-[0.875rem] font-[560]">
          {kind === "host_interest" ? "Anything we should know" : "How can we help"}
          {kind === "host_interest" && <span className="font-[400] text-[var(--mk-faint)]"> (optional)</span>}
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          className="mk-field"
          rows={4}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? `${id}-message-err` : undefined}
        />
        {errors.message && (
          <p id={`${id}-message-err`} className="text-[0.8125rem] text-[#a2392f]">
            {errors.message}
          </p>
        )}
      </div>
      {/* Honeypot, hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <AnimatePresence initial={false}>
        {failed && (
          <motion.p
            role="alert"
            className="rounded-[12px] bg-[#fbeceb] px-4 py-3 text-[0.9375rem] text-[#7d2a22]"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            That did not go through. Try again, or write to{" "}
            <a href={`mailto:${fallbackEmail}`} className="mk-link">
              {fallbackEmail}
            </a>
            .
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <p className="text-[0.8125rem] text-[var(--mk-faint)]">We reply within one working day.</p>
        <button type="submit" disabled={isLoading} className="mk-btn mk-btn-primary">
          {isLoading ? "Sending" : submitLabel}
        </button>
      </div>
    </form>
  );
}
