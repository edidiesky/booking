import type { Tenant } from "@/types/api";

interface OwnerContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Props {
  tenant: Tenant;
  ownerContact?: OwnerContact;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "#a3a6af" }}>{label}</span>
      <span className="text-xs bold" style={{ color: "#17191c" }}>{value}</span>
    </div>
  );
}

const STATUS_CFG: Record<Tenant["status"], { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-[#f2f0ed] text-[#4c4c4c]" },
  active:    { label: "Active",    className: "bg-green-50 text-green-700" },
  suspended: { label: "Suspended", className: "bg-red-50 text-red-700" },
};

export default function TenantInfoPanel({ tenant, ownerContact }: Props) {
  const cfg = STATUS_CFG[tenant.status];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase mb-3" style={{ color: "#a3a6af" }}>Business Information</p>
        <div className="flex flex-col gap-3">
          <Field label="Name"          value={tenant.name} />
          <Field label="Slug"          value={tenant.slug} />
          <Field label="Status"        value={<span className={`px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>} />
          <Field label="Platform fee"  value={`${tenant.platformFeePct}%`} />
          <Field label="Created"       value={new Date(tenant.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })} />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase mb-3" style={{ color: "#a3a6af" }}>Settings</p>
        <div className="flex flex-col gap-3">
          <Field label="Timezone" value={tenant.settings.timezone} />
          <Field label="Currency" value={tenant.settings.currency} />
          <Field label="Locale"   value={tenant.settings.locale} />
        </div>
      </div>

      {ownerContact && (
        <div>
          <p className="text-xs uppercase mb-3" style={{ color: "#a3a6af" }}>Owner Contact</p>
          <div className="flex flex-col gap-3">
            <Field label="Name"  value={`${ownerContact.firstName} ${ownerContact.lastName}`} />
            <Field label="Email" value={<a href={`mailto:${ownerContact.email}`} className="underline">{ownerContact.email}</a>} />
            {ownerContact.phone && <Field label="Phone" value={ownerContact.phone} />}
          </div>
        </div>
      )}
    </div>
  );
}