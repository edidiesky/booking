const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN ?? "bukkings.space";

export function getSubdomainFromHostname(hostname: string = window.location.hostname): string | null {
  const host = hostname.toLowerCase();
  if (!host.endsWith(`.${PLATFORM_DOMAIN}`)) return null;
  const subdomain = host.slice(0, -(PLATFORM_DOMAIN.length + 1));
  if (!subdomain || subdomain === "www") return null;
  return subdomain;
}