import { ChevronRight } from "lucide-react";

interface Props {
  tenantName: string | null;
  tenantSlug?: string | null;
  avatarUrl?: string | null;
}

function TenantAvatar({
  name,
  avatarUrl,
}: {
  name: string | null;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? "Storefront"}
        className="h-12 w-12 rounded-full object-cover border border-[#e8e6e3]"
      />
    );
  }

  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
      style={{ backgroundColor: "#6C5CE7" }}
    >
      {initial}
    </div>
  );
}

export default function StorefrontHeader({
  tenantName,
  tenantSlug,
  avatarUrl,
}: Props) {
  return (
    <div className="flex items-center gap-2.5 px-4 lg:px-6 py-3 border-b border-[#f2f0ed]">
      <div
        className="mx-auto w-full px-4 flex items-center gap-2.5"
        style={{ maxWidth: "1280px" }}
      >
        <TenantAvatar name={tenantName} avatarUrl={avatarUrl} />
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-semibold text-[#17171A]">
            {tenantName ?? "Storefront"}
          </span>
          {tenantSlug && (
            <span className="text-sm text-[#8A8A94]">
              {tenantSlug}.bukkings.space
            </span>
          )}
        </div>
        <ChevronRight size={16} className="text-[#B4B4BC] ml-1" />
      </div>
    </div>
  );
}
