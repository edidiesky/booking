import { motion }           from "framer-motion";
import { Building2, User }  from "lucide-react";
import { Link }             from "react-router-dom";
import { UserChoice } from "./onboarding/hooks/useOnboarding";
interface Props {
  onSelect: (choice: UserChoice) => void;
}

const OPTIONS: {
  value:       UserChoice;
  label:       string;
  description: string;
  Icon:        React.ElementType;
}[] = [
  {
    value:       "guest",
    label:       "I'm a Guest",
    description: "Browse properties and book stays for my trips.",
    Icon:        User,
  },
  {
    value:       "host",
    label:       "I'm a Host",
    description: "List my property and manage reservations from a dashboard.",
    Icon:        Building2,
  },
];

export default function StepSelectUserType({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1
          className="text-[28px] leading-[1.1]"
          style={{ color: "var(--color-ink)", letterSpacing: "-0.5px" }}
        >
          How will you use the platform?
        </h1>
        <p className="text-[15px]" style={{ color: "var(--color-muted-stone)" }}>
          Choose your account type to get started.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {OPTIONS.map(({ value, label, description, Icon }) => (
          <motion.button
            key={value}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(value)}
            className="flex items-start gap-4 p-5 border-2 rounded-2xl text-left transition-colors hover:border-[var(--color-ink)]"
            style={{ borderColor: "#e5e7eb", backgroundColor: "var(--color-canvas)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--color-fog)" }}
            >
              <Icon size={18} style={{ color: "var(--color-ink)" }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                {label}
              </p>
              <p className="text-sm" style={{ color: "var(--color-muted-stone)" }}>
                {description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-sm text-center" style={{ color: "var(--color-muted-stone)" }}>
        Already have an account?{" "}
        <Link
          to="/login"
          className="underline underline-offset-4"
          style={{ color: "var(--color-ink)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}