
import TwoFactorSection from "@/components/dashboard/common/TwoFactorSection";
import { useGetSecurityStatusQuery } from "@/redux/services/securityApi";

export default function TwoFactorTab() {
  const { data, isLoading } = useGetSecurityStatusQuery();
  if (isLoading || !data) {
    return <div className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }
  return <TwoFactorSection enabled={data.data.twoFactorEnabled} />;
}