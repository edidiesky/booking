import { useGetMyProfileQuery, useUpdateMyProfileMutation } from "@/redux/services/profileApi";
import { showToast }       from "@/components/common/Toast";
import type { UpdateProfilePayload } from "@/types/api";

export function useGuestProfile() {
  const { data, isLoading }                   = useGetMyProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation();

  const profile = data?.data;

  const handleUpdate = async (payload: UpdateProfilePayload) => {
    try {
      await updateProfile(payload).unwrap();
      showToast("Profile updated.", "success");
    } catch { /* errorMiddleware */ }
  };

  return { profile, isLoading, saving, handleUpdate };
}