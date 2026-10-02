import { Link } from "react-router-dom";
import Reveal from "./Reveal";

interface Props {
  title: string;
  body: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}

export default function CtaBand({ title, body, primary, secondary }: Props) {
  return (
    <section className="mk-container pb-[clamp(4.5rem,3rem+6vw,8.5rem)]">
      <Reveal className="grid gap-8 rounded-[32px] bg-[var(--mk-lagoon)] px-6 py-12 text-white sm:px-12 sm:py-16 lg:grid-cols-[minmax(0,1.4fr)_auto] lg:items-end">
        <div>
          <h2 className="mk-h2 max-w-[18ch] text-white">{title}</h2>
          <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-relaxed text-white/75">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={primary.to} className="mk-btn mk-btn-inverse">
            {primary.label}
          </Link>
          {secondary && (
            <Link to={secondary.to} className="mk-btn text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] hover:bg-white/10">
              {secondary.label}
            </Link>
          )}
        </div>
      </Reveal>
    </section>
  );
}
