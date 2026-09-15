import { Calendar, Phone, MapPin, Briefcase } from "lucide-react";
import ProfileAvatarHeader from "./ProfileAvatarHeader";
import ProfileInfoSection from "./ProfileInfoSection";
import type { UserProfileDetail } from "./types";

interface Props {
  user: UserProfileDetail;
}

function addressLine(address: Record<string, string>): string {
  const parts = ["street", "city", "state", "country"]
    .map((k) => address[k])
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "\u2014";
}

export default function ProfileSidebar({ user }: Props) {
  return (
    <div
      className="w-full md:w-[280px] shrink-0 flex flex-col gap-6 p-5 border-r overflow-y-auto"
      style={{ borderColor: "#e8e6e3" }}
    >
      <ProfileAvatarHeader user={user} />

      <ProfileInfoSection
        title="Personal Information"
        rows={[
          {
            icon: Calendar,
            label: "Joined",
            value: new Date(user.createdAt).toLocaleDateString(),
          },
          { icon: Briefcase, label: "Role", value: user.userType },
        ]}
      />

      <ProfileInfoSection
        title="Contact Information"
        rows={[
          { icon: Phone, label: "Phone", value: user.phone ?? "\u2014" },
          ...(user.profile
            ? [
                {
                  icon: MapPin,
                  label: "Address",
                  value: addressLine(user.profile.address),
                },
              ]
            : []),
        ]}
      />

      {user.profile?.bio && (
        <div className="flex flex-col gap-2">
          <p className="text-xs lg:text-[13px] font-semibold text-[#17191c]">
            Bio
          </p>
          <p className="text-xs text-[#777b86] leading-relaxed">
            {user.profile.bio}
          </p>
        </div>
      )}
    </div>
  );
}
