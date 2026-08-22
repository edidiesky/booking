import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  selectCurrentUser,
  selectRefreshToken,
  clearCredentials,
} from "@/redux/slices/authSlice";
import { useLogoutMutation } from "@/redux/services/authApi";
import { showToast } from "@/components/common/Toast";
import Avatar from "./Avatar";
import { apiSlice } from "@/redux/services/apiSlice";

export interface AccountDropdownItem {
  label: string;
  to: string;
  icon: LucideIcon;
  group?: number;
}

interface Props {
  items: AccountDropdownItem[];
  profilePath: string;
  triggerLabel: string;
  trigger?: React.ReactNode;
}

export default function AccountDropdown({
  items,
  profilePath,
  triggerLabel,
  trigger,
}: Props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const refreshToken = useSelector(selectRefreshToken);
  const [logout] = useLogoutMutation();

  const initial = currentUser?.firstName?.charAt(0).toUpperCase() ?? "?";
  const fullName = [currentUser?.firstName, currentUser?.lastName]
    .filter(Boolean)
    .join(" ");

  const handleSignOut = async () => {
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch {
      /* errorMiddleware, proceed to clear regardless */
    }
    dispatch(clearCredentials());
    dispatch(apiSlice.util.resetApiState());
    localStorage.removeItem("auth:refreshToken");
    localStorage.removeItem("auth:accessToken");
    navigate("/");
    showToast("Signed out successfully.", "success");
  };

  const groups = items.reduce<Record<number, AccountDropdownItem[]>>(
    (acc, item) => {
      const g = item.group ?? 0;
      (acc[g] ??= []).push(item);
      return acc;
    },
    {},
  );
  const groupKeys = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  // console.log("currentUser:", currentUser)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <div className="flex items-center gap-2">
            <Avatar
              src={currentUser?.profileImage}
              email={currentUser?.email}
              name={triggerLabel}
              size={32}
            />
            <span
              className="text-xs lg:text-[13px]     hidden md:block truncate max-w-[140px]"
              style={{ color: "var(--color-ink)" }}
            >
              {triggerLabel}
            </span>
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 bg-white border border-[#e8e6e3] rounded-xl shadow-lg p-1.5"
      >
        {/* Identity header: avatar + name + email, matches the reference's
            top block, also links to the profile page since that's the most
            natural target for tapping your own identity row. */}
        <DropdownMenuItem asChild>
          <Link
            to={profilePath}
            className="flex items-center gap-3 px-2.5 py-2.5 mb-1 cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none"
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs lg:text-[13px]     shrink-0"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-canvas)",
              }}
            >
              {initial}
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs lg:text-[13px]     text-[#17191c] truncate">
                {fullName || "My Account"}
              </span>
              <span className="text-xs lg:text-[13px]   capitalize text-[#777b86] truncate">{`${currentUser?.userType} profile`}</span>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />

        <div className="w-full flex flex-col">
          {groupKeys.map((groupKey, i) => (
            <div key={groupKey} className="w-full flex flex-col gap-2">
              {groups[groupKey].map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link
                      to={item.to}
                      className="flex items-center gap-3 px-2.5 py-2 text-xs lg:text-[13px]   font-semibold text-[#17191c] cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none"
                    >
                      <Icon size={24} className="text-[#4c4c4c] shrink-0" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              {i < groupKeys.length - 1 && (
                <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />
              )}
            </div>
          ))}
        </div>

        <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-3 px-2.5 py-2 text-xs lg:text-[13px]     text-red-600 cursor-pointer hover:bg-red-50 rounded-lg outline-none"
        >
          <LogOut size={16} className="shrink-0" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
