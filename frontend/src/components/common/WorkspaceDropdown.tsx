import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ChevronDown,
  Settings,
  UserPlus,
  Building2,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import { useGetMyTenantQuery } from "@/redux/services/tenantApi";

const ROLE_BADGE: Record<string, string> = {
  "platform:admin": "Platform Admin",
  "host:admin": "Admin",
  "host:staff": "Staff",
  "host:inspector": "Inspector",
  guest: "Guest",
};

interface Props {
  onSignOut: () => void;
}

export default function WorkspaceDropdown({ onSignOut }: Props) {
  const currentUser = useSelector(selectCurrentUser);
  const { data: tenant } = useGetMyTenantQuery();

  const initial = tenant?.data?.name?.charAt(0).toUpperCase() ?? "W";
  const roleBadge = currentUser?.userType
    ? (ROLE_BADGE[currentUser.userType] ?? currentUser.userType)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-between gap-2 w-full px-2 py-2 rounded-lg hover:bg-[#f5f5f3] transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
              style={{ backgroundColor: "var(--color-ink)" }}
            >
              {initial}
            </span>
            <span
              className="text-sm truncate"
              style={{ color: "var(--color-ink)" }}
            >
              {tenant?.data?.name ?? "Loading..."}
            </span>
          </div>
          <ChevronDown size={14} className="text-[#777b86] shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-64 bg-white border border-[#e8e6e3] rounded-xl shadow-lg p-1.5"
      >
        <div className="flex items-start gap-3 px-2.5 py-2.5 mb-1 min-w-0 w-full overflow-hidden">
          <span
            className="w-10 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
            style={{ backgroundColor: "var(--color-ink)" }}
          >
            {initial}
          </span>

          {/* min-w-0 is required so this flex child can shrink below content size */}
          <div className="min-w-0 flex-1 gap-1 overflow-hidden">
            <p
              className="text-xs lg:text-sm font-medium text-[#17191c] truncate"
              title={tenant?.data?.name}
            >
              {tenant?.data?.name}
            </p>

            {/* block + w-full + min-w-0 — not a bare inline span */}
            <p
              className="block w-full min-w-0 truncate text-[11px] lg:text-xs text-[#777b86]"
              title={currentUser?.email}
            >
              {currentUser?.email}
            </p>

            {roleBadge && (
              <span className="inline-block mt-1 px-2 py-0.5 font-semibold rounded-full bg-blue-50 text-blue-600 text-[10px] lg:text-xs max-w-full truncate">
                {roleBadge}
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />

        <div className="flex flex-col w-full gap-2">
          <DropdownMenuItem asChild>
            <Link
              to="/dashboard/account"
              className="flex items-center gap-3 px-2.5 py-2 text-xs lg:text-[13px] text-[#17191c] cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none"
            >
              <Settings size={16} className="text-[#4c4c4c] shrink-0" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/dashboard/roles"
              className="flex items-center gap-3 px-2.5 py-2 text-xs lg:text-[13px] text-[#17191c] cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none"
            >
              <UserPlus size={16} className="text-[#4c4c4c] shrink-0" />
              Add &amp; manage members
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              to="/dashboard/properties"
              className="flex items-center gap-3 px-2.5 py-2 text-xs lg:text-[13px] text-[#17191c] cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none"
            >
              <Building2 size={16} className="shrink-0" />
              View properties
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />

          <DropdownMenuItem
            onClick={onSignOut}
            className="flex items-center gap-3 px-2.5 py-2 text-xs lg:text-[13px] text-red-600 cursor-pointer hover:bg-red-50 rounded-lg outline-none"
          >
            <LogOut size={16} className="shrink-0" />
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
