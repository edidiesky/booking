
import TwoFactorSection from "@/components/dashboard/common/TwoFactorSection";
import VerificationSection from "@/components/dashboard/common/VerificationSection";
import { useGetSecurityStatusQuery } from "@/redux/services/securityApi";
import type { User } from "@/types/api";

interface Props {
  user: User;
}

export default function SecurityTab({ user }: Props) {
  const { data, isLoading } = useGetSecurityStatusQuery();

  if (isLoading || !data) {
    return <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <VerificationSection
        isEmailVerified={data.data.isEmailVerified}
        isPhoneVerified={data.data.isPhoneVerified}
        hasPhone={Boolean(user?.phone)}
      />
      <TwoFactorSection enabled={data.data.twoFactorEnabled} />
    </div>
  );
}