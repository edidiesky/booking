import type { ReactNode } from "react";
import Reveal from "./Reveal";

interface Props {
  kicker?: string;
  title: string;
  lead?: string;
  action?: ReactNode;
  align?: "split" | "stack";
  id?: string;
}

export default function SectionHeading({ kicker, title, lead, action, align = "split", id }: Props) {
  return (
    <div
      className={`mb-12 grid gap-6 lg:mb-16 ${
        align === "split" ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end" : ""
      }`}
    >
      <div className="flex flex-col gap-4">
        {kicker && (
          <Reveal>
            <p className="mk-kicker">{kicker}</p>
          </Reveal>
        )}
        <Reveal index={1} as="h2" className="mk-h2 max-w-[18ch]">
          <span id={id}>{title}</span>
        </Reveal>
      </div>
      {(lead || action) && (
        <Reveal index={2} className="flex flex-col items-start gap-5">
          {lead && <p className="mk-lead">{lead}</p>}
          {action}
        </Reveal>
      )}
    </div>
  );
}
