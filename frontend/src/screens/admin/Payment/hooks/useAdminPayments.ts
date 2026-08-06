import { useState } from "react";
import { useGetTenantPaymentStatsQuery } from "@/redux/services/paymentApi";
import type { PaymentStatus, PaymentGateway } from "@/types/api";
import { useListAdminPaymentsQuery } from "@/redux/services/adminApi";

export function useTenantPayments() {
  const [page, setPage] = useState(1);
const { data: statsData, isLoading: isStatsLoading } = useGetTenantPaymentStatsQuery();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [gatewayFilter, setGatewayFilter] = useState<PaymentGateway | "">("");

  const { data, isLoading } = useListAdminPaymentsQuery({ page, limit: 10 });

  const allPayments = data?.data.payments ?? [];

  const payments = allPayments.filter((p) => {
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchGateway = !gatewayFilter || p.gateway === gatewayFilter;
    return matchStatus && matchGateway;
  });

  return {
    payments,
    isLoading,
    page,
    setPage,
    statusFilter,
    setStatusFilter,
    gatewayFilter,
    setGatewayFilter,
    stats: statsData?.data,
    isStatsLoading,
  };
}
