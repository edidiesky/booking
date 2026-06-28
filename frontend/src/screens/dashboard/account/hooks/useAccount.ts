import { useGetMyTenantQuery, useUpdateSettingsMutation, useUpdateCancellationPolicyMutation } from "@/redux/services/tenantApi";
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from "@/redux/services/profileApi";
import { showToast } from "@/components/common/Toast";
import type { UpdateTenantSettingsPayload, UpdateCancellationPolicyPayload, UpdateProfilePayload } from "@/types/api";

export function useAccount() {
  const { data: tenantData, isLoading: loadingTenant } = useGetMyTenantQuery();
  const { data: profileData, isLoading: loadingProfile } = useGetMyProfileQuery();

  const [updateSettings,   { isLoading: savingSettings }]  = useUpdateSettingsMutation();
  const [updatePolicy,     { isLoading: savingPolicy   }]  = useUpdateCancellationPolicyMutation();
  const [updateProfile,    { isLoading: savingProfile  }]  = useUpdateMyProfileMutation();

  const tenant  = tenantData?.data;
  const profile = profileData?.data;

  const handleUpdateSettings = async (payload: UpdateTenantSettingsPayload) => {
    try {
      await updateSettings(payload).unwrap();
      showToast("Settings updated.", "success");
    } catch { /* errorMiddleware */ }
  };

  const handleUpdatePolicy = async (payload: UpdateCancellationPolicyPayload) => {
    try {
      await updatePolicy(payload).unwrap();
      showToast("Cancellation policy updated.", "success");
    } catch { /* errorMiddleware */ }
  };

  const handleUpdateProfile = async (payload: UpdateProfilePayload) => {
    try {
      await updateProfile(payload).unwrap();
      showToast("Profile updated.", "success");
    } catch { /* errorMiddleware */ }
  };

  return {
    tenant, profile,
    isLoading: loadingTenant || loadingProfile,
    handleUpdateSettings, savingSettings,
    handleUpdatePolicy,   savingPolicy,
    handleUpdateProfile,  savingProfile,
  };
}