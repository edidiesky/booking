import { useState } from "react";
import { useListAdministratorsQuery, useDemoteAdministratorMutation } from "@/redux/services/adminApi";
import { useGetPlatformStatsQuery } from "@/redux/services/adminApi";
import { showToast } from "@/components/common/Toast";

export function useAdminAdministrators() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useListAdministratorsQuery({ page });
  const { data: statsData } = useGetPlatformStatsQuery();
  const [demote, { isLoading: isDemoting }] = useDemoteAdministratorMutation();

  const allAdministrators = data?.data.administrators ?? [];
  const administrators = search
    ? allAdministrators.filter((a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()),
      )
    : allAdministrators;

  const handleDemote = async (id: string, name: string) => {
    if (!window.confirm(`Revoke platform admin access for ${name}?`)) return;
    try {
      await demote(id).unwrap();
      showToast(`${name}'s admin access revoked.`, "success");
    } catch {
      /* errorMiddleware */
    }
  };

  return {
    administrators, isLoading, isFetching,
    page, setPage,
    totalPages: data?.data.totalPages ?? 1,
    search, setSearch,
    handleDemote, isDemoting,
    totalCount: statsData?.data.administrators ?? 0,
  };
}