import type { ReactNode } from "react";

interface Props {
  headers:           string[];
  total:             number;
  totalPages:        number;
  currentPage:       number;
  onPageChange:      (page: number) => void;
  search:            string;
  onSearch:          (v: string) => void;
  searchPlaceholder?: string;
  isLoading:         boolean;
  isEmpty:           boolean;
  emptyMessage?:     string;
  toolbar?:          ReactNode;
  children:          ReactNode;
  colSpan:           number;
}

function Skeleton({ colSpan }: { colSpan: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b" style={{ borderColor: "#f2f0ed" }}>
          {Array.from({ length: colSpan }).map((__, j) => (
            <td key={j} className="px-5 py-3">
              <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#f2f0ed", width: `${55 + (j * 13) % 35}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable({
  headers, total, totalPages, currentPage, onPageChange,
  search, onSearch, searchPlaceholder = "Search...",
  isLoading, isEmpty, emptyMessage = "No records found",
  toolbar, children, colSpan,
}: Props) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);

  return (
    <div className="w-full flex flex-col gap-4">
      {toolbar}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => { onSearch(e.target.value); if (currentPage !== 1) onPageChange(1); }}
          placeholder={searchPlaceholder}
          className="w-48 lg:w-64 h-9 px-3 text-xs lg:text-[13px]     border outline-none transition-colors"
          style={{ borderColor: "#e8e6e3", color: "var(--color-ink)", backgroundColor: "var(--color-canvas)" }}
        />
        <span className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
          {total} {total === 1 ? "record" : "records"}
        </span>
      </div>

      <div className="border overflow-x-auto" style={{ borderColor: "#e8e6e3" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e8e6e3" }}>
              {headers.map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs lg:text-xsuppercase whitespace-nowrap"
                    style={{ color: "var(--color-hint-of-grey)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? <Skeleton colSpan={colSpan} />
              : isEmpty ? (
                <tr>
                  <td colSpan={colSpan} className="px-5 py-12 text-center text-xs"
                      style={{ color: "var(--color-hint-of-grey)" }}>
                    {search ? `${emptyMessage} for "${search}"` : emptyMessage}
                  </td>
                </tr>
              ) : children}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
            className="h-8 px-3 text-xs lg:text-[13px]     border disabled:opacity-40 hover:bg-[#f2f0ed] transition-colors"
            style={{ borderColor: "#e8e6e3", color: "var(--color-muted-stone)" }}>
            Prev
          </button>
          {pages.map((p) => (
            <button key={p} onClick={() => onPageChange(p)}
              className="h-8 w-8 text-xs lg:text-[13px]     border transition-colors"
              style={{
                backgroundColor: currentPage === p ? "var(--color-ink)" : "transparent",
                color:           currentPage === p ? "var(--color-canvas)" : "var(--color-muted-stone)",
                borderColor:     currentPage === p ? "var(--color-ink)" : "#e8e6e3",
              }}>
              {p}
            </button>
          ))}
          <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
            className="h-8 px-3 text-xs lg:text-[13px]     border disabled:opacity-40 hover:bg-[#f2f0ed] transition-colors"
            style={{ borderColor: "#e8e6e3", color: "var(--color-muted-stone)" }}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}