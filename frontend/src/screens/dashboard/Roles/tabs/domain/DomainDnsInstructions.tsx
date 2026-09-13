const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN ?? "bukkings.space";

interface Props {
  domain: string;
  token: string | null;
}

export default function DomainDnsInstructions({ domain, token }: Props) {
  return (
    <div className="rounded-lg p-3 text-sm flex flex-col gap-2" style={{ backgroundColor: "#f7f7f8" }}>
      <p className="text-[#777b86]">Add these two DNS records at your domain provider:</p>
      <div>
        <p className="text-[#a3a6af]">CNAME</p>
        <p className="font-mono text-[#17191c]">{domain} → {PLATFORM_DOMAIN}</p>
      </div>
      <div>
        <p className="text-[#a3a6af]">TXT</p>
        <p className="font-mono text-[#17191c] break-all">
          _bukkings-verify.{domain} → {token ?? "\u2014"}
        </p>
      </div>
      <p className="text-[#a3a6af]">Both records can take up to a few hours to propagate.</p>
    </div>
  );
}