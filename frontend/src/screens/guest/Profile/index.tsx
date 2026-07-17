import { motion }          from "framer-motion";
import Header              from "@/components/common/Header";
import Footer              from "@/components/common/Footer";
import ProfileForm         from "./ProfileForm";
import { useGuestProfile } from "./hooks/useGuestProfile";

export default function GuestProfile() {
  const { profile, isLoading, saving, handleUpdate } = useGuestProfile();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />
      <main className="flex-1">
        <div className="mx-auto px-6 lg:px-8 py-12" style={{ maxWidth: "640px" }}>
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-xl bold"
                style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
              My Profile
            </h1>
            <p className="text-xs" style={{ color: "var(--color-light-steel)" }}>
              Update your personal details.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse"
                     style={{ backgroundColor: "#f2f0ed" }} />
              ))}
            </div>
          ) : (
            <ProfileForm profile={profile} onSubmit={handleUpdate} isSaving={saving} />
          )}
        </div>
      </main>
      <Footer />
    </motion.div>
  );
}