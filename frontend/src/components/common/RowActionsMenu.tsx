import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface RowAction {
  label:      string;
  icon:       LucideIcon;
  onClick:    () => void;
  variant?:   "default" | "danger";
  hidden?:    boolean;
  separator?: boolean;
}

interface Props { actions: RowAction[]; }

export default function RowActionsMenu({ actions }: Props) {
  const visible = actions.filter((a) => !a.hidden);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors rounded-full outline-none"
        >
          <MoreHorizontal size={16} className="text-[#4c4c4c]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-white border border-[#e8e6e3] rounded-xl shadow-lg p-1">
        {visible.map((action, i) => {
          const Icon = action.icon;
          return (
            <div key={action.label}>
              {action.separator && i > 0 && <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />}
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                className={`flex items-center gap-2 px-3 py-2 text-xs lg:text-smcursor-pointer rounded-lg outline-none ${
                  action.variant === "danger"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-[#17191c] hover:bg-[#f2f0ed]"
                }`}
              >
                <Icon size={14} />
                {action.label}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}