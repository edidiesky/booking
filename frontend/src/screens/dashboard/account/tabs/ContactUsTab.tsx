import { Mail, MessageCircle } from "lucide-react";

// Placeholder contact channels, swap for your real support email/chat.
export default function ContactUsTab() {
  return (
    <div className="flex flex-col gap-3">
      <a
        href="mailto:support@example.com"
        className="rounded-xl border p-4 flex items-center gap-3 hover:bg-[#fafaf9] transition-colors"
        style={{ borderColor: "#e8e6e3" }}
      >
        <Mail size={16} style={{ color: "#4c4c4c" }} />
        <div>
          <p className="text-xs lg:text-[13px]   " style={{ color: "var(--color-ink)" }}>Email us</p>
          <p className="text-xs" style={{ color: "#777b86" }}>support@example.com</p>
        </div>
      </a>
      <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "#e8e6e3" }}>
        <MessageCircle size={16} style={{ color: "#4c4c4c" }} />
        <div>
          <p className="text-xs lg:text-[13px]   " style={{ color: "var(--color-ink)" }}>Live chat</p>
          <p className="text-xs" style={{ color: "#777b86" }}>Available weekdays, 9am-5pm.</p>
        </div>
      </div>
    </div>
  );
}