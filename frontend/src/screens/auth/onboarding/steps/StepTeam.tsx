import { useState } from "react";
import { X } from "lucide-react";
import OnboardingShell from "../components/OnboardingShell";

export interface PendingInvite {
  email: string;
  role: "host:staff" | "host:inspector" | "host:admin";
}

interface Props {
  invites: PendingInvite[];
  onChange: (invites: PendingInvite[]) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSending?: boolean;
}

const ROLES: { id: PendingInvite["role"]; label: string; hint: string }[] = [
  { id: "host:admin", label: "Manager", hint: "Full property access" },
  { id: "host:staff", label: "Staff", hint: "Day-to-day operations" },
  { id: "host:inspector", label: "Inspector", hint: "Check-in / quality" },
];

export default function StepTeam({
  invites,
  onChange,
  onContinue,
  onBack,
  onSkip,
  isSending,
}: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PendingInvite["role"]>("host:staff");

  const add = () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) return;
    if (invites.some((i) => i.email === e)) return;
    onChange([...invites, { email: e, role }]);
    setEmail("");
  };

  const remove = (e: string) => onChange(invites.filter((i) => i.email !== e));

  return (
    <OnboardingShell
      activeSegment="team"
      stepTitle="Step 4 of 5 · Team"
      headline="Build your team"
      subcopy="Invite the people who help you run properties. You can skip and invite later."
      onBack={onBack}
      preview={
        <div className="flex flex-col gap-3 text-xs">
          <p className="font-medium text-[#a3a6af] uppercase tracking-wide">
            Role permissions
          </p>
          <div className="rounded-xl border border-[#e8e6e3] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#fafaf9] text-[#a3a6af]">
                <tr>
                  <th className="p-2 font-medium">Access</th>
                  <th className="p-2 font-medium">Mgr</th>
                  <th className="p-2 font-medium">Staff</th>
                </tr>
              </thead>
              <tbody className="text-[#17191c]">
                <tr className="border-t border-[#e8e6e3]">
                  <td className="p-2">Properties</td>
                  <td className="p-2">✓</td>
                  <td className="p-2">✓</td>
                </tr>
                <tr className="border-t border-[#e8e6e3]">
                  <td className="p-2">Bookings</td>
                  <td className="p-2">✓</td>
                  <td className="p-2">✓</td>
                </tr>
                <tr className="border-t border-[#e8e6e3]">
                  <td className="p-2">Team & roles</td>
                  <td className="p-2">✓</td>
                  <td className="p-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#a3a6af]">
            {invites.length} pending invite{invites.length === 1 ? "" : "s"}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            className="flex-1 h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
            placeholder="colleague@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          />
          <select
            className="h-11 px-2 rounded-xl border border-[#e8e6e3] text-sm bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value as PendingInvite["role"])}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            className="h-11 px-4 rounded-xl text-sm bg-[#17191c] text-white"
          >
            Invite
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {invites.map((i) => (
            <li
              key={i.email}
              className="flex items-center justify-between rounded-xl border border-[#e8e6e3] px-3 py-2 text-sm"
            >
              <span>
                {i.email}{" "}
                <span className="text-xs text-[#a3a6af]">
                  · {ROLES.find((r) => r.id === i.role)?.label}
                </span>
              </span>
              <button type="button" onClick={() => remove(i.email)} aria-label="Remove">
                <X size={14} className="text-[#a3a6af]" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        disabled={isSending}
        onClick={onContinue}
        className="w-full h-12 rounded-full text-sm font-medium text-white bg-[#2563eb] hover:opacity-90 disabled:opacity-50"
      >
        {isSending ? "Sending…" : "Continue"}
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-xs text-[#777b86] hover:text-[#17191c]"
      >
        I&apos;ll do this later
      </button>
    </OnboardingShell>
  );
}