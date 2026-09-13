import dns from "dns/promises";
import logger from "./logger";

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN!;

export async function verifyDomainCNAME(
  customDomain: string,
): Promise<boolean> {
  try {
    const records = await dns.resolveCname(customDomain);
    const verified = records.some((r) => r.endsWith(PLATFORM_DOMAIN));

    logger.info("dns_cname_check_completed", {
      event: "dns_cname_check_completed",
      customDomain,
      records,
      verified,
    });

    return verified;
  } catch (err) {
    logger.warn("dns_cname_resolution_failed", {
      event: "dns_cname_resolution_failed",
      customDomain,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function verifyDomainTXT(
  customDomain: string,
  expectedToken: string,
): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(`_bukkings-verify.${customDomain}`);
    const flat = records.map((r) => r.join(""));
    const verified = flat.includes(expectedToken);

    logger.info("dns_txt_check_completed", {
      event: "dns_txt_check_completed",
      customDomain,
      verified,
    });

    return verified;
  } catch (err) {
    logger.warn("dns_txt_resolution_failed", {
      event: "dns_txt_resolution_failed",
      customDomain,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
