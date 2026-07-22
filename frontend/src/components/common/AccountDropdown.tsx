import { Link, useNavigate }         from "react-router-dom";
import { useDispatch, useSelector }  from "react-redux";
import { ChevronDown, LogOut }       from "lucide-react";
import type { LucideIcon }           from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { selectCurrentUser, selectRefreshToken, clearCredentials } from "@/redux/slices/authSlice";
import { useLogoutMutation } from "@/redux/services/authApi";
import { showToast }         from "@/components/common/Toast";

export interface AccountDropdownItem {
  label:      string;
  to:         string;
  icon:       LucideIcon;
  group?:     number;
}

interface Props {
  items:        AccountDropdownItem[];
  profilePath:  string;
  triggerLabel: string;
}

export default function AccountDropdown({ items, profilePath, triggerLabel }: Props) {
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const currentUser  = useSelector(selectCurrentUser);
  const refreshToken = useSelector(selectRefreshToken);
  const [logout]     = useLogoutMutation();

  const initial   = currentUser?.firstName?.charAt(0).toUpperCase() ?? "?";
  const fullName  = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ");

  const handleSignOut = async () => {
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch { /* errorMiddleware, proceed to clear regardless */ }
    dispatch(clearCredentials());
    navigate("/");
    showToast("Signed out successfully.", "success");
  };

  const groups = items.reduce<Record<number, AccountDropdownItem[]>>((acc, item) => {
    const g = item.group ?? 0;
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-9 px-5 text-xs text-[#000] transition-opacity hover:opacity-80 flex items-center gap-2 rounded-full outline-none hover:bg-[#f5f5f3]"
        >
          <span
            className="w-8 bold h-8 rounded-full flex text-[#000] items-center justify-center text-xs bg-[#f5f5f3] shrink-0"
          >
            {initial}
          </span>
          {triggerLabel}
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-60 bg-white border border-[#e8e6e3] rounded-xl shadow-lg p-1"
      >
        <DropdownMenuItem asChild>
          <Link
            to={profilePath}
            className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none border-b border-[#f2f0ed] mb-1"
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs shrink-0"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              {initial}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-xs bold text-[#17191c]">{fullName || "My Account"}</span>
              <span className="text-xs medium text-[#777b86]">View your profile</span>
            </div>
          </Link>
        </DropdownMenuItem>

        {Object.keys(groups)
          .map(Number)
          .sort((a, b) => a - b)
          .map((groupKey, i, arr) => (
            <div key={groupKey}>
              {groups[groupKey].map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link
                      to={item.to}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs bold text-[#17191c] cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none"
                    >
                      <Icon size={30} className="text-[#4c4c4c]" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              {i < arr.length - 1 && <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />}
            </div>
          ))}

        <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 text-xs bold text-red-600 cursor-pointer hover:bg-red-50 rounded-lg outline-none"
        >
          <LogOut size={16} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}