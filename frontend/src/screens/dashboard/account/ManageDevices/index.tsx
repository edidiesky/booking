import { useState } from "react";
import { Loader2 } from "lucide-react";
import SessionRow from "./SessionRow";
import {
  useGetMySessionsQuery,
  useRevokeSessionMutation,
  useLogoutOtherSessionsMutation,
  useLogoutAllSessionsMutation,
} from "@/redux/services/sessionApi";
// import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function ManageDevices() {
  const { data: sessions, isLoading } = useGetMySessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const [logoutOthers, { isLoading: isLoggingOutOthers }] =
    useLogoutOtherSessionsMutation();
  const [logoutAll] = useLogoutAllSessionsMutation();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  //   const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId).unwrap();
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutOthers = async () => {
    if (!confirm("Log out every other device? This device stays signed in."))
      return;
    await logoutOthers().unwrap();
  };

  const handleLogoutAll = async () => {
    if (
      !confirm(
        "Log out everywhere, including this device? You'll need to sign in again.",
      )
    )
      return;
    await logoutAll().unwrap();
    // dispatch(logout());
    navigate("/login");
  };

  const otherSessionsCount = (sessions ?? []).filter(
    (s) => !s.isCurrent,
  ).length;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-[17px] font-semibold text-[#17171A]">Devices</h2>
        <p className="text-[13px] text-[#8A8A94] mt-1">
          Manage where you're signed in.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-[13px] text-[#8A8A94]">
          <Loader2 size={14} className="animate-spin" /> Loading devices...
        </div>
      ) : (
        <>
          <div>
            {(sessions ?? []).map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onRevoke={handleRevoke}
                isRevoking={revokingId === session.id}
              />
            ))}
          </div>

          <div
            className="flex flex-col gap-2 mt-6 pt-6 border-t"
            style={{ borderColor: "#f2f0ed" }}
          >
            {otherSessionsCount > 0 && (
              <button
                onClick={handleLogoutOthers}
                disabled={isLoggingOutOthers}
                className="text-left text-[13px] font-medium text-[#17171A] hover:underline disabled:opacity-50"
              >
                {isLoggingOutOthers
                  ? "Logging out..."
                  : `Log out ${otherSessionsCount} other device${otherSessionsCount === 1 ? "" : "s"}`}
              </button>
            )}
            <button
              onClick={handleLogoutAll}
              className="text-left text-[13px] font-medium text-[#c0392b] hover:underline"
            >
              Log out of all devices
            </button>
          </div>
        </>
      )}
    </div>
  );
}
