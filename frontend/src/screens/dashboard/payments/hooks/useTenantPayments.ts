import { useState }                  from "react";
import { useGetTenantPaymentsQuery } from "@/redux/services/paymentApi";
import type { PaymentStatus, PaymentGateway } from "@/types/api";

export function useTenantPayments() {
  const [page,           setPage]           = useState(1);
  const [statusFilter,   setStatusFilter]   = useState<PaymentStatus   | "">("");
  const [gatewayFilter,  setGatewayFilter]  = useState<PaymentGateway  | "">("");

  const { data, isLoading } = useGetTenantPaymentsQuery({ page, limit: 10 });

  const allPayments = data?.data ?? [];

  const payments = allPayments.filter((p) => {
    const matchStatus  = !statusFilter  || p.status  === statusFilter;
    const matchGateway = !gatewayFilter || p.gateway === gatewayFilter;
    return matchStatus && matchGateway;
  });

  return {
    payments, isLoading,
    page, setPage,
    statusFilter,  setStatusFilter,
    gatewayFilter, setGatewayFilter,
  };
}