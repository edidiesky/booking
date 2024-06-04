"use client";
import { AnimatePresence } from "framer-motion";
import { useAppSelector } from "../hooks/useCustomRedux";
import LoginModal from "@/components/modals/Login";
import RegisterModal from "@/components/modals/Register";
const ModalsProvider = () => {
  const { loginmodal, registermodal } = useAppSelector((store) => store.modals);
  return (
    <>
      <AnimatePresence mode="wait">
        {loginmodal && (
          <LoginModal registermodal={registermodal} modal={loginmodal} />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {registermodal && <RegisterModal modal={registermodal} />}
      </AnimatePresence>
    </>
  );
};

export default ModalsProvider;
