import type { ReactNode } from "react";
import Reveal from "./Reveal";

interface Props {
  kicker: string;
  title: string;
  lead: string;
  actions?: ReactNode;
  aside?: ReactNode;
}

/** Inner-page hero: one claim, one sentence, the next action. */
export default function PageHero({ kicker, title, lead, actions, aside }: Props) {
  return (
    <section className="mk-container pb-16 pt-14 lg:pb-24 lg:pt-24">
      <div
        className={`grid gap-12 ${aside ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center" : ""}`}
      >
        <div className="flex flex-col gap-6">
          <Reveal onMount index={0}>
            <p className="mk-kicker">{kicker}</p>
          </Reveal>
          <Reveal onMount index={1} as="h1" className="mk-display max-w-[16ch]">
            {title}
          </Reveal>
          <Reveal onMount index={2}>
            <p className="mk-lead">{lead}</p>
          </Reveal>
          {actions && (
            <Reveal onMount index={3} className="flex flex-wrap items-center gap-3 pt-2">
              {actions}
            </Reveal>
          )}
        </div>
        {aside && (
          <Reveal onMount index={3} className="min-w-0">
            {aside}
          </Reveal>
        )}
      </div>
    </section>
  );
}
