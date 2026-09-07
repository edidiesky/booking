import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import Header from "@/components/common/Header";
import ProfilePageShell from "@/components/profile/ProfilePageShell";
import GuestProfileSidebar from "./GuestProfileSidebar";
import BookingsTab from "./tabs/BookingsTab";
import WishlistTab from "./tabs/WishlistTab";
import ReviewsTab from "./tabs/ReviewsTab";
import AccountTab from "./tabs/AccountTab";
import { useGuestProfile } from "./hooks/useGuestProfile";

const TABS = [
  { key: "bookings", label: "Purchase History" },
  { key: "wishlist", label: "Wishlist" },
  { key: "reviews", label: "Review" },
  { key: "account", label: "Account" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function GuestProfile() {
  const [active, setActive] = useState<TabKey>("bookings");
  const user = useSelector(selectCurrentUser);
  const { profile, isLoading } = useGuestProfile();
  const navigate = useNavigate();

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    profile?.displayName ||
    "Guest";

  const statusTone =
    user?.status === "active"
      ? "active"
      : user?.status === "suspended"
        ? "suspended"
        : "inactive";

  const main = (() => {
    switch (active) {
      case "bookings":
        return <BookingsTab />;
      case "wishlist":
        return <WishlistTab />;
      case "reviews":
        return <ReviewsTab />;
      case "account":
        return <AccountTab user={user!} />;
      default:
        return null;
    }
  })();

  return (
    <div className="flex flex-col gap-14 w-full">
         <Header />
      {isLoading && !user ? (
        <div className="p-12 text-[13px] text-[#a3a6af]">Loading profile…</div>
      ) : (
        <ProfilePageShell
          name={fullName}
          email={user?.email}
          avatarUrl={profile?.avatarUrl}
          statusLabel={
            user?.status
              ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
              : "Active"
          }
          statusTone={statusTone}
          secondaryId={
            user?.id
              ? `Guest ID #${user.id.slice(0, 6).toUpperCase()}`
              : undefined
          }
          primaryActionLabel="Edit profile"
          onPrimaryAction={() => setActive("account")}
          onBack={() => navigate(-1)}
          tabs={[...TABS]}
          activeTab={active}
          onTabChange={(k) => setActive(k as TabKey)}
          main={main}
          sidebar={
            <GuestProfileSidebar user={user} profile={profile ?? undefined} />
          }
        />
      )}
    </div>
  );
}