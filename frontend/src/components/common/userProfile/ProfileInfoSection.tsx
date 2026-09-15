import type { LucideIcon } from "lucide-react";

export interface InfoRow {
  icon:  LucideIcon;
  label: string;
  value: React.ReactNode;
}

interface Props {
  title: string;
  rows:  InfoRow[];
}

export default function ProfileInfoSection({ title, rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs lg:text-[13px] font-semibold text-[#17191c]">{title}</p>
      <div className="grid grid-cols-[20px_110px_1fr] gap-y-2.5 items-start">
        {rows.map((row) => (
          <RowItem key={row.label} row={row} />
        ))}
      </div>
    </div>
  );
}

function RowItem({ row }: { row: InfoRow }) {
  const Icon = row.icon;
  return (
    <>
      <Icon size={13} className="text-[#a3a6af] mt-0.5" />
      <span className="text-xs text-[#a3a6af]">{row.label}</span>
      <span className="text-xs lg:text-[13px] text-[#17191c] break-words">{row.value}</span>
    </>
  );
}