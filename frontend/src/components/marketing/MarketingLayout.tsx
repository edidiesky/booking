import "@/design/tokens.css";
import { useEffect, type ReactNode } from "react";
import { BRAND } from "@/config/brand";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

interface Props {
  children: ReactNode;
  /** Page title without the brand suffix. */
  title?: string;
  description?: string;
}

export default function MarketingLayout({ children, title, description }: Props) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND.name}` : `${BRAND.name}: ${BRAND.tagline}`;
    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
  }, [title, description]);

  return (
    <div className="mkt flex min-h-screen flex-col bg-[var(--mk-paper)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
