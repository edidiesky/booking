import type { ReactNode } from "react";
import { Pencil } from "lucide-react";

interface ProfileSidebarCardProps {
  title: string;
  onEdit?: () => void;
  children: ReactNode;
}

export default function ProfileSidebarCard({
  title,
  onEdit,
  children,
}: ProfileSidebarCardProps) {
  return (
    <section className=" p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base lg:text-lg font-semibold text-[#17191c]">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#a3a6af] hover:bg-[#f5f5f3] hover:text-[#17191c]"
            aria-label={`Edit ${title}`}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export function SidebarRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-row items-center gap-2">
      <span className="text-sm text-[#a3a6af]">{label}</span>
      <span className="text-sm text-[#17191c] break-words">{value}</span>
    </div>
  );
}

export function SidebarChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[#eef2ff] text-[#3730a3] text-sm font-medium px-2 py-1">
      {children}
    </span>
  );
}