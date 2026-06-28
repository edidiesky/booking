import { useDispatch }  from "react-redux";
import { useNavigate }  from "react-router-dom";
import { motion }       from "framer-motion";
import { Building, User } from "lucide-react";
import { setOnboardingStep } from "@/redux/slices/authSlice";
import AuthLayout       from "@/components/common/AuthLayout";

const OPTIONS = [
  {
    value:       "guest" as const,
    label:       "I'm a Guest",
    description: "Browse and book properties for my trips.",
    Icon:        User,
  },
  {
    value:       "host" as const,
    label:       "I'm a Host",
    description: "List my property and manage reservations.",
    Icon:        Building,
  },
];

export default function SelectUserType() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const handleSelect = (choice: "guest" | "host") => {
    dispatch(setOnboardingStep(1));
    navigate("/onboarding", { state: { userChoice: choice } });
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] leading-[1.1]" style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}>
            Join Booking Platform
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted-stone)" }}>
            How would you like to use the platform?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map(({ value, label, description, Icon }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(value)}
              className="flex items-start gap-4 p-5 border-2 rounded-2xl text-left transition-colors hover:border-[var(--color-ink)]"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--color-fog)" }}>
                <Icon size={18} style={{ color: "var(--color-ink)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>{label}</p>
                <p className="text-sm mt-0.5"        style={{ color: "var(--color-muted-stone)" }}>{description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}