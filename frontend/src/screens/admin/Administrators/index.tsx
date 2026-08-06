import { useState } from "react";
import { ShieldOff } from "lucide-react";
import {
  useListAdministratorsQuery,
  useDemoteAdministratorMutation,
} from "@/redux/services/adminApi";
import { showToast } from "@/components/common/Toast";
import { formatDate } from "@/utils/formatDate";

export default function AdminAdministrators() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListAdministratorsQuery({ page });
  const [demote, { isLoading: isDemoting }] = useDemoteAdministratorMutation();
  const administrators = data?.data.administrators ?? [];

  const handleDemote = async (id: string, name: string) => {
    if (!window.confirm(`Revoke platform admin access for ${name}?`)) return;
    try {
      await demote(id).unwrap();
      showToast(`${name}'s admin access revoked.`, "success");
    } catch {
      /* errorMiddleware */
    }
  };
  return (
    <div>
      <h1 className="text-2xl bold mb-6" style={{ color: "var(--color-ink)" }}>
        Administrators
      </h1>

      <table className="w-full text-xs">
        <thead>
          <tr
            className="border-b text-left"
            style={{
              borderColor: "#e8e6e3",
              color: "var(--color-hint-of-grey)",
            }}
          >
            <th className="py-3 font-normal">Name</th>
            <th className="py-3 font-normal">Email</th>
            <th className="py-3 font-normal">Since</th>
            <th className="py-3" />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={4}
                className="py-6 text-center"
                style={{ color: "var(--color-muted-stone)" }}
              >
                Loading...
              </td>
            </tr>
          ) : (
            administrators.map((a) => (
              <tr
                key={a.id}
                className="border-b"
                style={{ borderColor: "#f2f0ed" }}
              >
                <td className="py-3">
                  {a.firstName} {a.lastName}
                </td>
                <td
                  className="py-3"
                  style={{ color: "var(--color-muted-stone)" }}
                >
                  {a.email}
                </td>
                <td
                  className="py-3"
                  style={{ color: "var(--color-hint-of-grey)" }}
                >
                  {formatDate(a.createdAt)}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() =>
                      handleDemote(a.id, `${a.firstName} ${a.lastName}`)
                    }
                    disabled={isDemoting}
                    className="flex items-center gap-1 text-xs ml-auto disabled:opacity-50"
                    style={{ color: "#dc2626" }}
                  >
                    <ShieldOff size={13} /> Revoke
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="text-xs disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs" style={{ color: "var(--color-muted-stone)" }}>
          Page {page}
        </span>
        <button
          onClick={() => setPage((p) => (administrators.length < 20 ? p : p + 1))}
          disabled={administrators.length < 20}
          className="text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
