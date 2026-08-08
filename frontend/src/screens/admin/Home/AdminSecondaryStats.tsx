interface Props {
  propertiesCount: number;
  paymentsCount: number;
  guestsCount: number;
  activeTenantsCount: number;
}

export default function AdminSecondaryStats({ propertiesCount, paymentsCount, guestsCount, activeTenantsCount }: Props) {
  const stats = [
    { id: "properties", label: "Properties",        value: propertiesCount.toString(),   sub: "Listed across all sellers" },
    { id: "payments",   label: "Total Payments",     value: paymentsCount.toString(),     sub: "Successful transactions" },
    { id: "customers",  label: "Customers",          value: guestsCount.toString(),       sub: "Registered guest accounts" },
    { id: "tenants",    label: "Tenants",            value: activeTenantsCount.toString(), sub: "Active sellers on platform" },
  ];

  return (
    <div className="rounded-3xl border border-[var(--color-fog)] bg-[#f5f5f3] overflow-hidden px-1 pt-6 pb-1">
      <div className="w-full rounded-3xl bg-white grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-fog)]">
        {stats.map(({ id, label, value, sub }) => (
          <div key={id} className="flex h-36 lg:h-44 items-start flex-col justify-between gap-3 px-5 py-4">
            <p className="text-xs lg:text-sm uppercase medium" style={{ color: "var(--color-muted-stone)" }}>{label}</p>
            <div className="w-full flex flex-col gap-3">
              <h1 className="text-xl mt-1 font-semibold lg:text-3xl" style={{ color: "var(--color-ink)" }}>{value}</h1>
              <p className="text-xs lg:text-sm medium" style={{ color: "var(--color-muted-stone)" }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}