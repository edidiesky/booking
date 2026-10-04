import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LogOut, MonitorSmartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { clearCredentials } from "@/redux/slices/authSlice";
import { apiSlice } from "@/redux/services/apiSlice";
import {
  useGetMySessionsQuery,
  useRevokeSessionMutation,
  useLogoutOtherSessionsMutation,
  useLogoutAllSessionsMutation,
  type UserSession,
} from "@/redux/services/sessionApi";
import { showToast } from "@/components/common/Toast";
import ConfirmSessionModal, { type PendingAction } from "./ConfirmSessionModal";
import SessionDetailDrawer from "./SessionDetailDrawer";
import {
  DEVICE_ICONS,
  formatLastActive,
  formatDateTime,
  describeClient,
  describeLocation,
  describeIp,
} from "./sessionFormat";

const HEADERS = [
  "Device",
  "Browser",
  "Location",
  "IP address",
  "Signed in",
  "Last active",
  "",
];

export default function SessionsTab() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useGetMySessionsQuery(
    undefined,
    { refetchOnMountOrArgChange: true },
  );
  const [revokeSession, { isLoading: isRevoking }] = useRevokeSessionMutation();
  const [logoutOthers, { isLoading: isLoggingOutOthers }] =
    useLogoutOtherSessionsMutation();
  const [logoutAll, { isLoading: isLoggingOutAll }] =
    useLogoutAllSessionsMutation();

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [selected, setSelected] = useState<UserSession | null>(null);
  const isWorking = isRevoking || isLoggingOutOthers || isLoggingOutAll;

  // Current device first, then most recently active.
  const sessions = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      return (
        new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
      );
    });
  }, [data]);

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  const handleConfirm = async () => {
    if (!pending) return;
    try {
      if (pending.kind === "one") {
        await revokeSession(pending.session.id).unwrap();
        showToast(`${pending.session.deviceLabel} has been logged out.`, "success");
        if (selected?.id === pending.session.id) setSelected(null);
      } else if (pending.kind === "others") {
        const res = await logoutOthers().unwrap();
        showToast(res.message, "success");
        if (selected && !selected.isCurrent) setSelected(null);
      } else {
        await logoutAll().unwrap();
        // Server has revoked every session, including this one. Drop the
        // dead tokens and every cached query before leaving.
        dispatch(clearCredentials());
        dispatch(apiSlice.util.resetApiState());
        navigate("/login", { replace: true });
        return;
      }
      setPending(null);
    } catch {
      // rtkQueryErrorMiddleware surfaces the error toast. Keep the modal
      // open so the user can retry or cancel.
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
            Active sessions
          </h2>
          <p
            className="text-xs lg:text-[13px] mt-0.5"
            style={{ color: "var(--color-muted-stone)" }}
          >
            Devices currently signed in to your account. Select a row for details.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setPending({ kind: "others", count: otherCount })}
            disabled={otherCount === 0 || isWorking}
            className="h-9 px-3 rounded-lg border text-xs lg:text-[13px] inline-flex items-center gap-1.5 hover:bg-[#fafaf9] disabled:opacity-50"
            style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
          >
            <LogOut size={13} />
            Log out other devices
          </button>
          <button
            type="button"
            onClick={() => setPending({ kind: "all" })}
            disabled={isWorking || sessions.length === 0}
            className="h-9 px-4 rounded-lg text-xs lg:text-[13px] text-white inline-flex items-center gap-1.5 bg-red-600 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Log out everywhere
          </button>
        </div>
      </div>

      <div
        className="border rounded-xl overflow-x-auto"
        style={{ borderColor: "var(--color-fog)" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--color-fog)" }}>
              {HEADERS.map((h, i) => (
                <th
                  key={h || `h-${i}`}
                  className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap"
                  style={{ color: "var(--color-muted-stone)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b"
                  style={{ borderColor: "var(--color-fog)" }}
                >
                  {HEADERS.map((h, j) => (
                    <td key={h || `s-${j}`} className="px-4 py-4">
                      <div
                        className="h-4 rounded animate-pulse"
                        style={{ backgroundColor: "#f2f0ed", width: "70%" }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-5 py-12 text-center">
                  <p className="text-xs lg:text-[13px] text-[#777b86]">
                    Could not load your sessions.
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="mt-2 text-xs lg:text-[13px] underline underline-offset-4"
                    style={{ color: "var(--color-ink)" }}
                  >
                    Try again
                  </button>
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-5 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MonitorSmartphone size={16} className="text-[#777b86]" />
                    <span className="text-sm font-medium text-[#17191c]">
                      No active sessions
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              sessions.map((s) => {
                const Icon = DEVICE_ICONS[s.deviceType] ?? DEVICE_ICONS.unknown;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(s);
                      }
                    }}
                    tabIndex={0}
                    className="border-b last:border-0 cursor-pointer transition-colors hover:bg-[#fafaf9] focus:outline-none focus-visible:bg-[#fafaf9]"
                    style={{ borderColor: "var(--color-fog)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "#f7f7f5" }}
                        >
                          <Icon size={15} style={{ color: "#5B5B66" }} />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="text-xs lg:text-[13px] font-medium truncate"
                            style={{ color: "var(--color-ink)" }}
                          >
                            {s.deviceLabel}
                          </span>
                          {s.isCurrent && (
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                              style={{ backgroundColor: "#e6f7ed", color: "#1a7a3f" }}
                            >
                              This device
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs lg:text-[13px] whitespace-nowrap">
                      {describeClient(s)}
                    </td>
                    <td className="px-4 py-3 text-xs lg:text-[13px] whitespace-nowrap">
                      {describeLocation(s)}
                    </td>
                    <td className="px-4 py-3 text-xs lg:text-[13px] whitespace-nowrap font-mono">
                      {describeIp(s.ipAddress)}
                    </td>
                    <td className="px-4 py-3 text-xs lg:text-[13px] whitespace-nowrap">
                      {formatDateTime(s.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs lg:text-[13px] whitespace-nowrap">
                      <span
                        style={{
                          color: s.isCurrent ? "#1a7a3f" : "var(--color-muted-stone)",
                        }}
                      >
                        {formatLastActive(s.lastActiveAt, s.isCurrent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {!s.isCurrent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            // Do not also open the details drawer.
                            e.stopPropagation();
                            setPending({ kind: "one", session: s });
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                          disabled={isWorking}
                          className="text-xs lg:text-[13px] font-medium text-[#c0392b] hover:underline disabled:opacity-50"
                        >
                          Log out
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selected && (
          <SessionDetailDrawer
            session={selected}
            onClose={() => setSelected(null)}
            onRequestLogout={(session) => setPending({ kind: "one", session })}
            isWorking={isWorking}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pending && (
          <ConfirmSessionModal
            action={pending}
            onClose={() => setPending(null)}
            onConfirm={handleConfirm}
            isWorking={isWorking}
          />
        )}
      </AnimatePresence>
    </div>
  );
}