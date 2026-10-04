import Drawer from "@/components/common/Drawer";
import DrawerSection from "@/components/common/DrawerSection";
import DrawerField from "@/components/common/DrawerField";
import { CheckCircle2, LogOut } from "lucide-react";
import type { UserSession } from "@/redux/services/sessionApi";
import {
  DEVICE_ICONS,
  deviceTypeLabel,
  describeClient,
  describeIp,
  describeLocation,
  formatDateTime,
  formatDuration,
  formatLastActive,
} from "./sessionFormat";

interface Props {
  session: UserSession;
  onClose: () => void;
  onRequestLogout: (session: UserSession) => void;
  isWorking: boolean;
}

export default function SessionDetailDrawer({
  session,
  onClose,
  onRequestLogout,
  isWorking,
}: Props) {
  const Icon = DEVICE_ICONS[session.deviceType] ?? DEVICE_ICONS.unknown;
  const location = describeLocation(session);
  const ip = describeIp(session.ipAddress);

  return (
    <Drawer
      title="Session details"
      subtitle={`session ${session.id.slice(0, 8)}`}
      onClose={onClose}
    >
      {/* Device: icon, label, chip, last active */}
      <div className="px-6 pt-2 pb-4 flex flex-col items-start gap-3 border-b border-[#f2f0ed]">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center ring-1 ring-[#e8e6e3]"
          style={{ backgroundColor: "#f7f7f5" }}
        >
          <Icon size={26} style={{ color: "#5B5B66" }} />
        </div>
        <div className="min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#17191c] truncate">
              {session.deviceLabel}
            </p>
            {session.isCurrent ? (
              <span className="inline-flex items-center rounded-full bg-[#e6f7ed] text-[#1a7a3f] text-[11px] font-medium px-2 py-0.5">
                This device
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-[#e8f0ff] text-[#1a56ff] text-[11px] font-medium px-2 py-0.5">
                {deviceTypeLabel(session.deviceType)}
              </span>
            )}
          </div>
          <p className="text-xs text-[#a3a6af] mt-0.5">
            {formatLastActive(session.lastActiveAt, session.isCurrent)}
          </p>
          <p className="text-xs text-[#777b86] mt-0.5 truncate">
            {describeClient(session)}
          </p>
        </div>
      </div>

      <DrawerSection label="Overview">
        <DrawerField
          label="Status"
          value={
            <span className="inline-flex items-center gap-1.5 text-[#166534]">
              <CheckCircle2 size={14} className="text-[#22c55e]" />
              {session.isCurrent ? "Active, this device" : "Active"}
            </span>
          }
        />
        <DrawerField label="Device type" value={deviceTypeLabel(session.deviceType)} />
        <DrawerField label="Browser" value={session.browser ?? "Unknown"} />
        <DrawerField label="Operating system" value={session.os ?? "Unknown"} />
        <DrawerField
          label="Last active"
          value={formatLastActive(session.lastActiveAt, session.isCurrent)}
        />
      </DrawerSection>

      <DrawerSection label="Where">
        <DrawerField label="Location" value={location} />
        <DrawerField label="City" value={session.city ?? "Unknown"} />
        <DrawerField label="Country" value={session.country ?? "Unknown"} />
        <DrawerField
          label="IP address"
          value={<span className="font-mono">{ip}</span>}
        />
      </DrawerSection>

      <DrawerSection label="Record">
        <DrawerField
          label="Session ID"
          value={<span className="font-mono break-all">{session.id}</span>}
        />
        <DrawerField label="Signed in" value={formatDateTime(session.createdAt)} />
        <DrawerField
          label="Last activity recorded"
          value={formatDateTime(session.lastActiveAt)}
        />
        <DrawerField label="Session age" value={formatDuration(session.createdAt)} />
      </DrawerSection>

      <DrawerSection label="Actions">
        {session.isCurrent ? (
          <p className="text-xs lg:text-[13px] text-[#777b86]">
            This is the device you are using now. Use "Log out everywhere" on the
            sessions table to sign this device out.
          </p>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p className="text-xs lg:text-[13px] text-[#777b86]">
              Do not recognise this device? Log it out and change your password.
            </p>
            <button
              type="button"
              onClick={() => onRequestLogout(session)}
              disabled={isWorking}
              className="h-9 px-4 rounded-lg text-xs lg:text-[13px] text-white inline-flex items-center gap-1.5 bg-red-600 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <LogOut size={13} />
              Log out this device
            </button>
          </div>
        )}
      </DrawerSection>
    </Drawer>
  );
}