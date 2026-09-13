import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import InviteRoleSelect from "./InviteRoleSelect";
import InviteResultsList from "./InviteResultsList";
import type { Role } from "@/types/api";

interface Props {
  roles: Role[];
  onClose: () => void;
  onSubmit: (payload: { email: string; roleId: string }) => Promise<boolean>;
  isSaving: boolean;
}

function parseEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export default function InviteMemberModal({ roles, onClose, onSubmit, isSaving }: Props) {
  const [emailsRaw, setEmailsRaw] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [results, setResults] = useState<{ email: string; ok: boolean }[] | null>(null);

  const emails = parseEmails(emailsRaw);

  const handleSend = async () => {
    if (emails.length === 0 || !roleId) return;
    const outcomes = await Promise.all(
      emails.map(async (email) => ({ email, ok: await onSubmit({ email, roleId }) })),
    );
    setResults(outcomes);
    if (outcomes.every((o) => o.ok)) {
      setEmailsRaw("");
      onClose();
    }
  };

  return (
    <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-end md:justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        className="w-full md:w-[480px] md:max-w-[520px] rounded-2xl pt-6 justify-between relative items-start flex flex-col gap-4 bg-white"
      >
        <div className="w-full flex px-8 items-start justify-between gap-1">
          <div>
            <h3 className="text-lg text-[#17191c]">Invite Member</h3>
            <p className="text-xs lg:text-[13px] text-[#777b86] mt-1 max-w-[380px]">
              Invite team members by entering their emails, separated by commas, and assign roles.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f2f0ed] transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-[#777b86]" />
          </button>
        </div>

        <div className="w-full flex flex-col gap-4 px-8 pb-8">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>Email</label>
            <input
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              placeholder="user@company.com, user@company.com"
              className="w-full h-10 px-3 text-xs lg:text-[13px] border rounded-lg outline-none"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>Role</label>
            <InviteRoleSelect roles={roles} value={roleId} onChange={setRoleId} />
          </div>

          {results && <InviteResultsList results={results} />}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-full text-xs lg:text-[13px] border transition-opacity hover:opacity-80"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSaving || emails.length === 0 || !roleId}
              className="h-9 px-5 rounded-full text-xs lg:text-[13px] text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: "var(--color-ink)" }}
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              Send invite{emails.length > 1 ? `s (${emails.length})` : ""}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}