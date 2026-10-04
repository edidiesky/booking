import { Monitor, Smartphone, Tablet, HelpCircle } from "lucide-react";
import type { UserSession } from "@/redux/services/sessionApi";

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle,
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  session: UserSession;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}

export default function SessionRow({ session, onRevoke, isRevoking }: Props) {
  const Icon = DEVICE_ICONS[session.deviceType];
  const location = [session.city, session.country].filter(Boolean).join(", ");

  return (
    <div
      className="flex items-center justify-between py-4 border-b last:border-0"
      style={{ borderColor: "#f2f0ed" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "#f7f7f5" }}
        >
          <Icon size={18} style={{ color: "#5B5B66" }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-[#17171A]">
              {session.deviceLabel}
            </p>
            {session.isCurrent && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#e6f7ed", color: "#1a7a3f" }}
              >
                This device
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#8A8A94] mt-0.5">
            {location ? `${location} · ` : ""}Active{" "}
            {formatRelativeTime(session.lastActiveAt)}
          </p>
        </div>
      </div>

      {!session.isCurrent && (
        <button
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking}
          className="text-[13px] font-medium text-[#c0392b] hover:underline disabled:opacity-50"
        >
          {isRevoking ? "Logging out..." : "Log out"}
        </button>
      )}
    </div>
  );
}
