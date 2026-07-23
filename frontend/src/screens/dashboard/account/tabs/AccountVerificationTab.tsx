
import VerificationSection from "@/components/dashboard/common/VerificationSection";
import { useGetSecurityStatusQuery } from "@/redux/services/securityApi";

interface Props { hasPhone: boolean }

export default function AccountVerificationTab({ hasPhone }: Props) {
  const { data, isLoading } = useGetSecurityStatusQuery();
  if (isLoading || !data) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }
  return (
    <VerificationSection
      isEmailVerified={data.data.isEmailVerified}
      isPhoneVerified={data.data.isPhoneVerified}
      hasPhone={hasPhone}
    />
  );
}