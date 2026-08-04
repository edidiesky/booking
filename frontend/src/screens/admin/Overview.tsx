export default function AdminOverview() {
  return (
    <div>
      <h1 className="text-2xl bold mb-2" style={{ color: "var(--color-ink)" }}>Overview</h1>
      <p className="text-xs" style={{ color: "var(--color-muted-stone)" }}>
        Platform-wide metrics land here once the remaining admin resources (customers, administrators, audit logs) are built. Start with Sellers / Tenants in the sidebar.
      </p>
    </div>
  );
}