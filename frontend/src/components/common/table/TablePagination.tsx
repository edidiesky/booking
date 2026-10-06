import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { PaginationMeta } from "@/types/api";

interface Props {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
  noun?: { singular: string; plural: string };
}

type PageItem = number | "gap";

function pageWindow(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = [1, total, current - 1, current, current + 1]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const unique = [...new Set(wanted)];
  const items: PageItem[] = [];
  unique.forEach((p, i) => {
    if (i > 0 && p - unique[i - 1] > 1) items.push("gap");
    items.push(p);
  });
  return items;
}

export default function TablePagination({
  meta,
  onPageChange,
  isFetching = false,
  noun = { singular: "record", plural: "records" },
}: Props) {
  if (!meta || meta.total === 0) return null;

  const { page, limit, total, totalPages } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const label = total === 1 ? noun.singular : noun.plural;

  const go = (target: number) => {
    if (target < 1 || target > totalPages || target === page) return;
    onPageChange(target);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <span className="text-xs lg:text-[13px] text-[#a3a6af] inline-flex items-center gap-2">
        Showing {from} to {to} of {total} {label}
        {isFetching && <Loader2 size={12} className="animate-spin" />}
      </span>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={page === 1 || isFetching}
            aria-label="Previous page"
            className="h-8 px-2 rounded-lg text-xs lg:text-[13px] border border-[#e8e6e3] text-[#4c4c4c] disabled:opacity-40 hover:bg-[#f2f0ed] inline-flex items-center"
          >
            <ChevronLeft size={14} />
          </button>

          {pageWindow(page, totalPages).map((item, i) =>
            item === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-[#a3a6af]">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => go(item)}
                disabled={isFetching}
                aria-current={item === page ? "page" : undefined}
                className={`h-8 min-w-8 px-2 rounded-lg text-xs lg:text-[13px] border ${
                  item === page
                    ? "bg-[#17191c] text-white border-[#17191c]"
                    : "border-[#e8e6e3] text-[#4c4c4c] hover:bg-[#f2f0ed]"
                } disabled:cursor-wait`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page === totalPages || isFetching}
            aria-label="Next page"
            className="h-8 px-2 rounded-lg text-xs lg:text-[13px] border border-[#e8e6e3] text-[#4c4c4c] disabled:opacity-40 hover:bg-[#f2f0ed] inline-flex items-center"
          >
            <ChevronRight size={14} />
          </button>
        </nav>
      )}
    </div>
  );
}
