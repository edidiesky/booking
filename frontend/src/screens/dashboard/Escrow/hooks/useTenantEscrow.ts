import { useState }                from "react";
import { useGetTenantEscrowQuery } from "@/redux/services/escrowApi";

export function useTenantEscrow() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetTenantEscrowQuery({ page, limit: 10 });

  const escrows    = data?.data ?? [];
  const held       = escrows.filter((e) => e.status === "held").reduce((s, e) => s + e.amountNgn, 0);
  const released   = escrows.filter((e) => e.status === "released").reduce((s, e) => s + e.hostPayoutNgn, 0);

  return { escrows, isLoading, page, setPage, held, released };
}