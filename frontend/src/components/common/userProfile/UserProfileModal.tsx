import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useGetUserProfileQuery } from "@/redux/services/userProfileApi";
import ProfileSidebar from "./ProfileSidebar";
import ProfileTabs, { type ProfileTab } from "./ProfileTabs";
import ProfileActivityTab from "./ProfileActivityTab";

interface Props {
  userId:  string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: Props) {
  const [tab, setTab] = useState<ProfileTab>("activity");
  const { data: user, isLoading } = useGetUserProfileQuery(userId);

  return (
    <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[860px] h-[80vh] rounded-2xl bg-white flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "#e8e6e3" }}>
          <p className="text-sm font-semibold text-[#17191c]">User Detail</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#f2f0ed]">
            <X size={16} className="text-[#777b86]" />
          </button>
        </div>

        {isLoading || !user ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#a3a6af]">Loading profile...</div>
        ) : (
          <div className="flex-1 flex min-h-0">
            <ProfileSidebar user={user} />
            <div className="flex-1 flex flex-col min-w-0">
              <ProfileTabs active={tab} onChange={setTab} />
              <div className="flex-1 overflow-y-auto">
                {tab === "activity" && <ProfileActivityTab userId={userId} />}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}