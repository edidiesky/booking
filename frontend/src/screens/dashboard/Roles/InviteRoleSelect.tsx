import { useState, useRef, useEffect } from "react";
import { ChevronDown, ShieldCheck, Users, Eye, KeyRound } from "lucide-react";
import type { Role } from "@/types/api";

const ROLE_ICON: Record<string, typeof ShieldCheck> = {
  "host:admin": ShieldCheck,
  "host:staff": Users,
  "host:inspector": Eye,
};

interface Props {
  roles: Role[];
  value: string;
  onChange: (roleId: string) => void;
}

export default function InviteRoleSelect({ roles, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = roles.find((r) => r.id === value);
  const SelectedIcon = selected ? ROLE_ICON[selected.slug] ?? KeyRound : KeyRound;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-10 px-3 flex items-center justify-between text-xs lg:text-[13px] border rounded-lg outline-none"
        style={{ borderColor: "#e8e6e3", color: "#17191c" }}
      >
        <span className="flex items-center gap-2">
          <SelectedIcon size={13} className="text-[#777b86]" />
          {selected?.name ?? "Select a role"}
        </span>
        <ChevronDown size={14} className="text-[#a3a6af]" />
      </button>

      {selected?.description && (
        <p className="text-[11px] text-[#a3a6af] mt-1.5 leading-relaxed">{selected.description}</p>
      )}

      {open && (
        <div
          className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto"
          style={{ borderColor: "#e8e6e3" }}
        >
          {roles.map((r) => {
            const Icon = ROLE_ICON[r.slug] ?? KeyRound;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => { onChange(r.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs lg:text-[13px] text-left hover:bg-[#f2f0ed]"
                style={{ color: "#17191c", backgroundColor: r.id === value ? "#f2f0ed" : "transparent" }}
              >
                <Icon size={13} className="text-[#777b86]" />
                {r.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}