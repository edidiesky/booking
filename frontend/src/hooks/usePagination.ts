import { useCallback, useEffect, useState } from "react";
import type { PaginationMeta } from "@/types/api";

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const resetPage = useCallback(() => setPage(1), []);
  return { page, setPage, resetPage };
}

export function useClampPage(
  meta: PaginationMeta | undefined,
  page: number,
  setPage: (page: number) => void,
) {
  useEffect(() => {
    if (meta && page > meta.totalPages) setPage(meta.totalPages);
  }, [meta, page, setPage]);
}