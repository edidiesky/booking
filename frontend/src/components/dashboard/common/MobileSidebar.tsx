import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearCredentials, selectCurrentUser, selectRefreshToken } from "@/redux/slices/authSlice";
import { slideSidebarFromLeft } from "@/constants/framer";
import { NAV_GROUPS } from "./Sidebar";
import NavGroup from "./NavGroup";
import SidebarFooter from "./SidebarFooter";
import { useLogoutMutation } from "@/redux/services/authApi";
import { showToast } from "@/components/common/Toast";
import { useNavigate } from "react-router-dom";
import { apiSlice } from "@/redux/services/apiSlice";

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: Props) {
  const currentUser = useSelector(selectCurrentUser);
    const refreshToken  = useSelector(selectRefreshToken);
    const [logout]      = useLogoutMutation();
      const dispatch      = useDispatch();
        const navigate      = useNavigate();
      
  
  const handleSignOut = async () => {
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch {
      /* */
    } finally {
      dispatch(apiSlice.util.resetApiState());
      dispatch(clearCredentials());
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/");
      showToast("Signed out successfully.", "success");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] lg:hidden">
          <motion.aside
            variants={slideSidebarFromLeft}
            initial="initial"
            animate="enter"
            exit="exit"
            className="absolute top-0 left-0 h-full w-[280px] flex flex-col"
            style={{ backgroundColor: "var(--color-canvas)" }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "#ebebeb" }}>
              <span className="text-lg bold" style={{ color: "var(--color-ink)" }}>
                Booking
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f0ed] transition-colors"
              >
                <X size={18} style={{ color: "var(--color-ink)" }} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3" onClick={onClose}>
              {NAV_GROUPS.map((group) => (
                <NavGroup key={group.label} group={group} />
              ))}
            </nav>

            <SidebarFooter onSignOut={handleSignOut} currentUser={currentUser} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}