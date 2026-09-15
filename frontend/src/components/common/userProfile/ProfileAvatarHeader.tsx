import { Mail, MessageCircle } from "lucide-react";
import type { UserProfileDetail } from "./types";

interface Props {
  user: UserProfileDetail;
}

export default function ProfileAvatarHeader({ user }: Props) {
  const initial = user.firstName?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {user.profile?.avatarUrl ? (
          <img src={user.profile.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-ink)" }}
          >
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#17191c] truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-[#a3a6af]">{user.userType}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`mailto:${user.email}`}
          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm lg:text-[13px] text-white hover:opacity-90"
          style={{ backgroundColor: "var(--color-ink)" }}
        >
          <Mail size={13} />
          Send Email
        </a>
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm lg:text-[13px] border hover:bg-[#f2f0ed]"
          style={{ borderColor: "#e8e6e3", color: "#17191c" }}
        >
          <MessageCircle size={13} />
          Message
        </button>
      </div>
    </div>
  );
}