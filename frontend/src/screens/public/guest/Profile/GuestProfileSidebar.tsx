import ProfileSidebarCard, {
  SidebarRow,
  SidebarChip,
} from "@/components/profile/ProfileSidebarCard";
import type { Profile, User } from "@/types/api";

interface Props {
  user: User | null | undefined;
  profile: Profile | null | undefined;
  onEditContact?: () => void;
  onEditAddress?: () => void;
}

export default function GuestProfileSidebar({
  user,
  profile,
  onEditContact,
  onEditAddress,
}: Props) {
  const address = profile?.address;
  const addressLine = [address?.city, address?.state, address?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex w-full border rounded-xl bg-white p-4 flex-col gap-4">
      <ProfileSidebarCard title="Customer Details">
        <SidebarRow
          label="Customer source"
          value={
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              Platform
            </span>
          }
        />
        <SidebarRow
          label="Last online"
          value={
            user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"
          }
        />
      </ProfileSidebarCard>

      <ProfileSidebarCard title="Address" onEdit={onEditAddress}>
        {addressLine ? (
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-medium text-[#17191c]">
              {profile?.displayName || user?.firstName || "Guest"}
            </p>
            <p className="text-sm text-[#777b86] leading-relaxed">
              {addressLine}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#a3a6af]">No address on file</p>
        )}
      </ProfileSidebarCard>

      <ProfileSidebarCard title="Contact information" onEdit={onEditContact}>
        <div className="flex flex-wrap gap-1.5">
          {user?.email && <SidebarChip>{user.email}</SidebarChip>}
          {profile?.phone && <SidebarChip>{profile.phone}</SidebarChip>}
          {!user?.email && !profile?.phone && (
            <p className="text-sm text-[#a3a6af]">No contact info</p>
          )}
        </div>
      </ProfileSidebarCard>

      <ProfileSidebarCard title="Tags">
        <div className="flex flex-wrap gap-1.5">
          <SidebarChip>Guest</SidebarChip>
          {user?.isEmailVerified && <SidebarChip>Verified email</SidebarChip>}
        </div>
      </ProfileSidebarCard>
    </div>
  );
}
